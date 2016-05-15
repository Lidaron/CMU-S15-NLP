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

var fs = require('fs');
var path = require('path');
var answering = require('./lib/answering');

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

	console.debug("\n==============================");

	console.debug("Q: ", input, "(index " + idx + ")");

	var context = answerer.getContext(input, function (context) {
		console.debug("------------------------------");

		console.debug("Answer: ");

		answerer.lookup(input, idx, context, function (r) {
			var text = r.text;
			var rcontext = r.context;

			console.log(r.answer);

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
