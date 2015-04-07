#!/usr/bin/env node

args = process.argv.slice(2);
if (args.length == 3)
	console.debug = console.log;
else 
	console.debug = function () {};

if (args.length < 2) {
	console.log("Need arguments: htmlfile, questionsfile");
	process.exit(0);
}

console.debug("Starting up..."); 

var unidecode = require('unidecode');

var fs = require('fs');
var path = require('path');
var natural = require("natural");
var tokenizer = new natural.TreebankWordTokenizer();
var pos = require("pos");
var answering = require('./lib/answering');
var tagger = new pos.Tagger();
var node_ner = require("node-ner");
var ner = new node_ner({ install_path: path.join(process.env.TOOLBOX, "stanford-ner") });

console.debug("------------------------------");

console.debug("Answering system is skimming file...");
var answerer = new answering(args[0]);

var questionfile = args[1];
var questions = fs.readFileSync(questionfile, { encoding: "utf8" }).split('\n');

function answerthis(questions, idx) {
	if (questions.length == 0) return;
	var input = questions.shift();
	if (input == "") {
		answerthis(questions, idx+1);
		return;
	}

	console.log("\n==============================");

	console.log("Q: ", input, "(index " + idx + ")");

	var context = {};
	context.tokens = tokenizer.tokenize(input);
	context.pos = tagger.tag(context.tokens);

	console.debug(context.pos);

	fs.writeFileSync("input.txt", input);
	ner.fromFile("input.txt", function (entities) {
		console.debug("Named entities: \n", entities);
		context.ner = entities;

		console.log("------------------------------");

		console.debug("Answer: ");

		answerer.lookup(input, idx, context, function (r) {
			var text = r.text;
			var confidence = r.confidence;
			var rcontext = r.context;

			console.log("Not sure, but here's something that might help: ");

			console.debug("------------------------------");

			console.debug("Evidence:");
			console.log(text);

			console.debug("------------------------------");

			console.debug("Named entities: \n", rcontext.ner);
			answerthis(questions, idx+1);
		});
	});
}

if (questions.length) {
	answerthis(questions, 0);
}
else {
	console.debug("No questions were asked.");
}

/* var node_coref = require("./lib/node-coref");
var coref = new node_coref({
	install_path: path.join(process.env.TOOLBOX, "stanford-nlp")
});
coref.fromFile("bestSentence.txt", function (res) {
	console.log(res);
}); */


/* var tokens = tokenizer.tokenize(input);
var tagged = new pos.Tagger().tag(tokens);
console.log(tagged);*/


/*
console.log("==================================================");
console.log("Stanford CoreNLP");
console.log("==================================================");

var NLP = require('stanford-corenlp');
var coreNLP = new NLP.StanfordNLP({
	"nlpPath" : process.env.STANFORD_NLP ? process.env.STANFORD_NLP : "./stanford-nlp",
	"version" : "3.5.1"
});

coreNLP.loadPipelineSync();
coreNLP.process("What? Who is the secretary-general of the awesome United Nations?", function(err, result) {
	console.log(result.document.sentences);
});
*/

/*

coreNLP.loadPipelineSync({
	annotators: ["tokenize", "ssplit", "pos", "lemma", "ner", "parse"]
});

coreNLP.process("Who is the secretary-general of the awesome United Nations?", function(err, result) {
	if (err) {
		console.log(err);
		return;
	}

	var sentences = result.document.sentences.sentence;
	for (var key in result) {
		console.log(key);
	}

	if (!(sentences instanceof Array)) sentences = [ sentences ];
	for (var i in sentences) {
		var sentence = sentences[i];
		console.log(JSON.stringify(sentence, null, '  '));
	}
});

*/
