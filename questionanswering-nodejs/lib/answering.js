var unidecode = require('unidecode');
var fs = require('fs');
var path = require('path');
var node_ner = require("node-ner");
var ner = new node_ner({ install_path: path.join(process.env.TOOLBOX, "stanford-ner") });
var cheerio = require('cheerio');
var natural = require("natural");
natural.PorterStemmer.attach();
var tokenizer = new natural.TreebankWordTokenizer();
var TfIdf = natural.TfIdf;

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

answerer.prototype.lookup = function (question, questionIdx, context, callback) {
	var totalHit = 0;

	var values = [];

	fs.writeFileSync("question.txt", question);
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

	this.getBestParagraph(context, values, "", function (r) {
		callback(r);
	});
};

answerer.prototype.getBestParagraph = function (context, values, bestParagraph, callback) {
	var scope = this;

	var paragraph = bestParagraph;
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
	fs.writeFileSync("evidence.txt", text);
	ner.fromFile("evidence.txt", function (entities) {
		function subsetNER() {
			for (var type in context.ner) {
				if (!(type in entities)) return false;
				for (var i = 0; i < context.ner[type].length; i++) {
					if (entities[type].indexOf(context.ner[type][i]) == -1)
						return false;
				}
			}
			return true;
		}

		if (score < 0 || subsetNER()) {
			callback({
				text: text,
				confidence: score > 0 ? score : 0,
				context: {
					ner: entities
				}
			});
		}
		else {
			if (bestParagraph === "" && paragraph !== "")
				bestParagraph = paragraph;
			scope.getBestParagraph(context, values, bestParagraph, callback);
		}
	});
};


module.exports = answerer;
