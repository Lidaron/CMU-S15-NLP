# Takes in two command line arguments.

# First, input the filepath of the document, then a space.
# Second, input the question.

# ####### EXAMPLE QUESTIONS WITH OUTPUTS !! ##############

# ex. python answered.py Pokemon.wiki The franchise celebrated its tenth anniversary in what year
# 	The franchise celebrated Pokmon Tenth Anniversaryits tenth anniversary in 2006

# What is the main staple of the Pokemon video game series
# 	The main staple of the Pokmon video game series revolves around the catching and battling of Pokmon

# How many Pokemon manga series were released in Englis
# There are various Pokmon manga series four of which were released in English by Viz Media and seven of them released in English by Chuang Yi

# Which generation of games does Pokemon X and Y for the Nintendo 3DS belong to
# 	Officially announced on January 8 2013 and released simultaneously worldwide on October 12 2013 Pokmon X and Y for the Nintendo 3DS are part of the sixth generation of games

# TODO: Make it use the unigram/bigram PROBABILITIES instead of just weighting everything equally.

import sys
import re

filePath = sys.argv[1]

question = ""

for i in range(2, len(sys.argv)):
	question = question + sys.argv[i] + " "

questionText = str.split(question)

unigram_weight = 1
bigram_weight = 2
trigram_weight = 3

file = open(filePath, "rw+")
lines = file.readlines()

bestScore = -1

bestSentence = ""

for line in lines:
	# Naively assume all periods are the end of a sentence. Every all sentence is ended by a period. "Mr. Jones disagrees!"
	line = re.sub('[^A-Za-z0-9. ]+', '', line)
	sentences = line.split(".")
	for sentence in sentences:
		score = 0;

		words = sentence.split();
#		print(sentence)
		# UNIGRAM
		for word in words:
			if word in questionText:
				score += unigram_weight
				

		# BIGRAM
		for i in range(0, len(words) - 1):
			bigram = words[i] + " " + words[i + 1]
			if bigram in question:
				score += bigram_weight

		# TRIGRAM
		for i in range(0, len(words) - 2):
			trigram = words[i] + " " + words[i + 1] + " " + words[i + 2]
			if trigram in question:
				score += trigram_weight

		if score > bestScore:
			bestScore = score
			bestSentence = sentence


print(bestSentence)
print(bestScore)
