# Takes in two command line arguments.

# First, input the filepath of the document, then a space.
# Second, input the question.

# ex. python answered.py Pokemon.wiki The franchise celebrated its tenth anniversary in what year

# TODO: Do more parsing. Split sentences better.


from __future__ import division
import sys
import re
import nltk.data
import math

filePath = sys.argv[1]

question = ""

for i in range(2, len(sys.argv)):
	question = question + sys.argv[i] + " "

questionText = str.split(question)

file = open(filePath, "rw+")
data = file.read()

data = re.sub('\n', '\n ',data)
data = re.sub('\[.*\]', '', data)
data = re.sub('[^A-Za-z0-9.?!,\n ]+', '', data)

unigrams = {}
unigramTotal = 0

bigrams = {}
bigramTotal = 0

trigrams = {}
trigramTotal = 0

tokenizer = nltk.data.load('tokenizers/punkt/english.pickle')

sentences = tokenizer.tokenize(data)

for sentence in sentences:
	words = sentence.split()
	for i in range(0, len(words) - 1) :
		if words[i] in unigrams:
			unigrams[words[i]] = unigrams[words[i]] + 1
		else:
			unigrams[words[i]] = 1
		unigramTotal+=1

		if i > 0:
			x = words[i-1] + " " + words[i];
			if x in bigrams:
				bigrams[x] = bigrams[x] + 1
			else:
				bigrams[x] = 1
			bigramTotal+=1

		if i > 1:
			x = words[i-2] + " " + words[i-1] + " " + words[i];
			if x in trigrams:
				trigrams[x] = trigrams[x] + 1
			else:
				trigrams[x] = 1
			trigramTotal+=1

for key in unigrams:
	unigrams[key] = math.log(unigrams[key] / unigramTotal)

for key in bigrams:
	bigrams[key] = math.log(bigrams[key] / bigramTotal)

for key in trigrams:
	trigrams[key] = math.log(trigrams[key] / trigramTotal)


bestScore = 1

bestSentence = ""

for sentence in sentences:
	score = 0;

	words = sentence.split();

	# UNIGRAM
	for word in words:
		if word in questionText:
			score += unigrams[word]
			
	# BIGRAM
	for i in range(0, len(words) - 1):
		bigram = words[i] + " " + words[i + 1]
		if bigram in question:
			score += 2 * bigrams[bigram]

	# TRIGRAM
	for i in range(0, len(words) - 2):
		trigram = words[i] + " " + words[i + 1] + " " + words[i + 2]
		if trigram in question:
			score += 3 * trigrams[trigram]

	if score < bestScore:
		bestScore = score
		bestSentence = sentence


print(bestSentence)
print(bestScore)
