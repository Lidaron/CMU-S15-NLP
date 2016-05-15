var results = {};

results.toDocument = function (sentences) {
	return { document: { sentences: { sentence: sentences } } };
};

results.getTokens = function (result) {
	var sentences = result.document.sentences.sentence;
	if (!(sentences instanceof Array)) sentences = [ sentences ];

	var tokens = [];
	for (var i = 0; i < sentences.length; i++) {
		for (var j = 0; j < sentences[i].tokens.token.length; j++)
			sentences[i].tokens.token[j].uid = sentences[i].$.id + "." + sentences[i].tokens.token[j].$.id;
		tokens = tokens.concat(sentences[i].tokens.token);
	}

	return tokens;
};

results.getText = function (result, original) {
	var sentences = result.document.sentences.sentence;
	if (!(sentences instanceof Array)) sentences = [ sentences ];

	var text = [];
	for (var i = 0; i < sentences.length; i++) {
		var tokens = sentences[i].tokens.token;
		if (!(tokens instanceof Array)) tokens = [ tokens ];

		text[i] = "";
		if (tokens.length > 0) {
			var start = parseInt(tokens[0].CharacterOffsetBegin);
			var end = parseInt(tokens[tokens.length-1].CharacterOffsetEnd);
			/*for (var j = start, k = 0; j < end; j++) {
				var token = tokens[k];
				if (parseInt(token.CharacterOffsetBegin) === j) {
					if (token.word === "-LRB-") token.word = "(";
					if (token.word === "-RRB-") token.word = ")";
					text[i] += token.word;
					j += token.word.length - 1;
					k++;
				}
				else {
					text[i] += " ";
				}
			}*/
			text[i] = original.substring(start, end);
		}
	}

	return text;
}

results.getNamedEntities = function (result) {
	var tokens = results.getTokens(result);

	var curr_ner = null;
	var curr_ent = null;
	var ner = {};
	for (var i = 0; i < tokens.length; i++) {
		if (curr_ner != tokens[i].NER) {
			if (curr_ent != null)
				ner[curr_ner].push(curr_ent.join(" "));
			curr_ent = [];
		}
		curr_ner = tokens[i].NER;
		if (ner[curr_ner] == null)
			ner[curr_ner] = [];
		curr_ent.push(tokens[i].word);
	}

	delete ner["O"];
	return ner;
};

results.getDependencies = function (result) {
	var sentences = result.document.sentences.sentence;
	if (!(sentences instanceof Array)) sentences = [ sentences ];

	var dependencies = [];
	for (var i = 0; i < sentences.length; i++) {
		for (var j = 0; j < sentences[i].dependencies.length; j++) {
			if (sentences[i].dependencies[j].$.type === "basic-dependencies") {
				dependencies[i] = [];
				var basicDependencies = sentences[i].dependencies[j];
				for (var k = 0; basicDependencies.dep && k < basicDependencies.dep.length; k++) {
					dependencies[i].push({
						type: basicDependencies.dep[k].$.type,
						governor: basicDependencies.dep[k].governor.$.idx,
						dependent: basicDependencies.dep[k].dependent.$.idx
					});
				}
				break;
			}
		}
	}
	return dependencies;
}

module.exports = results;
