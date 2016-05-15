"use strict";

var unidecode = require('unidecode');
var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');
var natural = require("natural");
natural.PorterStemmer.attach();
var tokenizer = new natural.TreebankWordTokenizer();
var TfIdf = natural.TfIdf;

var wordnet = new natural.WordNet();
/*wordnet.lookup('node', function(results) {
	console.log(results);
});*/

var NLP = require('stanford-corenlp');
var coreNLP = new NLP.StanfordNLP({
	"nlpPath" : path.join(process.env.TOOLBOX, "stanford-nlp"),
	"version" : "3.5.1"
});
var results = require('./results');
coreNLP.loadPipelineSync();

function answerer(filename) {
	var html = fs.readFileSync(filename, { encoding: "utf8" });
	var $ = this.$ = cheerio.load(html);
	var $body = this.$body = $("body");
	var $ps = this.$ps = $body.find("p");

	this.tfidf = new TfIdf();
	this.pmap = [];
	for (var i = 0; i < $ps.length; i++) {
	    var $p = $($ps[i]);
	    var ptext = unidecode($p.text());
	    var text = ptext.split(".");
	    for (var j = 0; j < text.length; j++) {
	        if (text[j]) {
				this.tfidf.addDocument((text[j] + ".").toLowerCase().tokenizeAndStem(true).join(" "));
				this.pmap[this.pmap.length] = i;
	        }
	    }
	}
}

answerer.prototype.getContext = function (input, callback) {
	var context = {};

	coreNLP.process(input, function(err, result) {
		if (err) {
			console.log(err);
			return;
		}

		var tokens = results.getTokens(result);
		console.debug("Tokens: \n", tokens);
		context.tokens = tokens;

		//console.log(JSON.stringify(result, null, '  '));

		var entities = results.getNamedEntities(result);
		console.debug("Named entities: \n", entities);
		context.ner = entities;

		var dependencies = results.getDependencies(result);
		console.debug("Dependencies: \n", dependencies);
		context.dep = dependencies.pop(); // information overload! handle only one sentence

		function find(query) {
			var res = [];
			for (var i = 0; i < context.dep.length; i++) {
				var found = true;
				for (var field in query) {
					if (context.dep[i][field] !== query[field]) {
						found = false;
						break;
					}
				}
				if (found) {
					res.push(context.dep[i]);
				}
			}
			return res;
		}

		function whdep(governor) {
			var idx_gov = parseInt(governor) - 1;
			var deps = find({ governor: governor });
			for (var i = 0; i < deps.length; i++) {
				var idx_dep = parseInt(deps[i].dependent) - 1;
				if (["WDT", "WP", "WP$", "WRB"].indexOf(tokens[idx_dep].POS) !== -1) {
					if (tokens[idx_dep].lemma === "how" && tokens[idx_gov].lemma === "many")
						context.qexpect = ["NUMBER"];
					else if (tokens[idx_dep].lemma === "what" && tokens[idx_gov].lemma === "number")
						context.qexpect = ["NUMBER"];
					else if (tokens[idx_dep].lemma === "who")
						context.qexpect = ["PERSON"];
					return true;
				}
				if (whdep(deps[i].dependent))
					return true;
			}
			return false;
		}

		function auxdep(governor, type) {
			var deps = find({ governor: governor });
			if (deps.length === 0) {
				switch (type) {
					case "aux":
					case "cop":
						return true;
					default:
						return false;
				}
			}
			for (var i = 0; i < deps.length; i++) {
				if (auxdep(deps[i].dependent, deps[i].type))
					return true;
			}
			return false;
		}

		context.qtype = "statistical";
		var dep = find({ type: "root" });
		if (dep.length > 0) {
			dep = dep[0];
			if (dep !== null && whdep(dep.dependent))
				context.qtype = "wh";
			else if (dep !== null && auxdep(dep.dependent))
				context.qtype = "truth";
			console.debug(context.qtype);
		}

		callback(context);
	});
}

answerer.prototype.lookup = function (question, questionIdx, context, callback) {
	var totalHit = 0;
	var values = [];

	this.tfidf.tfidfs(unidecode(question).toLowerCase().tokenizeAndStem(true), function (i, measure) {
		values[i] = {
			index: i,
			score: measure
		};
	    totalHit += measure;
	});

	values.sort(function (va, vb) {
		return vb.score - va.score;
	});

	this.getBestParagraph(this, context, values, "", callback, 3);
};

answerer.prototype.getBestParagraph = function (scope, context, values, bestAnswer, callback, n) {
	var paragraph = "";
	var score = -1;

	var $ = this.$;
	var $body = this.$body;
	var $ps = this.$ps;
	var pmap = this.pmap;

	if (values.length > 0) {
		var map = values.shift();
		paragraph = $($ps[pmap[map.index]]);
		score = map.score;
	}

	var text = unidecode(paragraph.text());
	coreNLP.process(text, function (err, result) {
		if (err) {
			console.log(err);
			return;
		}
		scope.processParagraph(scope, result, text, context, values, callback, n, bestAnswer);
	});
};

answerer.prototype.processParagraph = function (scope, result, text, qcontext, values, callback, n, bestAnswer) {
	var context = {};

	var dependencies = results.getDependencies(result);
	var alltext = results.getText(result, text);

	var entities = results.getNamedEntities(result);
	context.ner = entities;

	function getLemma(governor, tokens) {
		return tokens[parseInt(governor)-1].lemma;
	}
	var qtokens = qcontext.tokens;

	function test(qdep, rdep, rtokens) {
		var objmap = {};

		function test_helper(qdep, i) {
			if (qdep.length === 0)
				return true;
			if (i < rdep.length)
				return null;

			var addedG = false, addedD = false, qg, rg, qd, rd;

			if (qdep[0].type !== rdep[i].type)
				return null;

			if (qdep[0].type !== "root" && qdep[0].type !== "aux") {
				qg = qdep[0].governor;
				rg = rdep[i].governor;
				qd = qdep[0].dependent;
				rd = rdep[i].dependent;
				if (typeof objmap[qg] === "undefined" || typeof objmap[qd] === "undefined") { 
					if (getLemma(qg, qtokens) === getLemma(rg, rtokens) && getLemma(qd, qtokens) === getLemma(rd, rtokens)) {
						if (typeof objmap[qg] === "undefined") {
							objmap[qg] = rg;
							addedG = true;
						}

						if (typeof objmap[qd] === "undefined") {
							objmap[qd] = rd;
							addedD = true;
						}
					}
					else {
						return null;
					}
				}
				else if (objmap[qg] !== rg && objmap[qd] !== rd) { 
					return null;
				}
			}

			if (test_helper(qdep.slice(1), 0))
				return true;

			if (addedG) delete objmap[qg];
			if (addedD) delete objmap[qd];

			if (test_helper(qdep, i+1))
				return true;
			return null;
		}

		return test_helper(qdep, 0);
	}

	var answer = null;

	for (var i = 0; answer === null && i < result.document.sentences.sentence.length; i++) {
		var doc = { document: { sentences: { sentence: result.document.sentences.sentence[i] } } };
		var tokens = results.getTokens(doc);
		var subentities = results.getNamedEntities(doc);

		context.evidence = alltext[i];
		context.dep = dependencies[i]; 

		switch (qcontext.qtype) {
			case "truth":
				switch (test(qcontext.dep, context.dep, tokens)) {
					case true:
						answer = "Yep! " + context.evidence;
						break;
					case false:
						answer = "Nope! " + context.evidence;
						break;
				}
				break;
			case "wh":
				if (qcontext.qexpect instanceof Array && qcontext.qexpect.indexOf("NUMBER") !== -1
						&& typeof context.ner["NUMBER"] !== "undefined" && context.ner["NUMBER"].length === 1
						&& typeof subentities["NUMBER"] !== "undefined" && subentities["NUMBER"].length === 1)
					answer = "I think the answer is " + context.ner["NUMBER"][0].toLowerCase() + ". " + context.evidence;
				else if (qcontext.qexpect instanceof Array && qcontext.qexpect.indexOf("PERSON") !== -1
						&& typeof context.ner["PERSON"] !== "undefined" && context.ner["PERSON"].length === 1
						&& typeof subentities["PERSON"] !== "undefined" && subentities["PERSON"].length === 1)
					answer = context.ner["PERSON"][0] + " may be who you're after. " + context.evidence;
				break;
			default:
				answer = "Hmm... " + context.evidence;
				break;
		}
	}

	if (answer === null) {
		switch (qcontext.qtype) {
			case "truth":
				answer = "Probably not. " + text;
				break;
			default:
				answer = "Hmm... " + text;
				break;
		}
	}

	function subsetNER() {
		for (var type in qcontext.ner) {
			if (!(type in entities)) return false;
			for (var i = 0; i < qcontext.ner[type].length; i++) {
				if (entities[type].indexOf(qcontext.ner[type][i]) == -1)
					return false;
			}
		}
		return true;
	}

	if (subsetNER()) {
		callback({
			answer: answer,
			text: text,
			context: context
		});
	}
	else if (n === 0) {
		callback({
			answer: bestAnswer,
			text: "",
			context: context
		});
	}
	else {
		if (bestAnswer === "")
			bestAnswer = answer;
		scope.getBestParagraph(scope, qcontext, values, bestAnswer, callback, n-1);
	}
};


module.exports = answerer;
