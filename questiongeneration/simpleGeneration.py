# Takes in simple sentences (declartive) and makes them into sentences.
#
# For example: It was the best day of my life -> What was the best day of my life?
#      Alexis Larry is the best. -> Who is the best?
# Very naive. 

# Use: python simpleGeneration.py Alexis Larry is the best person in the world.


import nltk
import sys

from nltk.tag.stanford import NERTagger

EXIST = ['is', 'was', 'were', 'are']

# Adds a question mark
def changeToQuestionMark(tokens):
	if tokens[-1] == '.':
		tokens[-1] = '?'
	return tokens

# Changes a sentence into a question
def changeToQuestion():
	sentence = ''
	for i in range(1, len(sys.argv)):
		sentence = sentence + sys.argv[i] + ' '

	tokens = nltk.word_tokenize(sentence)
	(success, question) = whatQuestion(tokens)
	if success: 
		return question
	(success, question) = whoQuestion(tokens)
	if success: 
		return question

# Creates a what question if possible
def whatQuestion(tokens):
	# TODO: look at sentence structure and maybe remove extranous stuff
	if(tokens[0].lower == 'it'):
		tokens = ['What'] + tokens[1:]	
		tokens = changeToQuestionMark(tokens)
		return (True, ' '.join(tokens[:-1] + tokens[-1]))
	return(False, None)

# Creates a who question if possible
def whoQuestion(tokens):
	st = NERTagger('../stanford-ner/classifiers/english.all.3class.distsim.crf.ser.gz', 
		'../stanford-ner/stanford-ner.jar')
	posTags = nltk.pos_tag(tokens)
	ner = st.tag(tokens)
	if posTags[0][1] == 'NNP' and ner[0][1] == 'PERSON':                 # We have a PERSON
		i = 0
		while(posTags[i][1] == 'NNP' and ner[i][1] == 'PERSON'):
			i = i+1
		if tokens[i] in EXIST:
			tokens = changeToQuestionMark(tokens)
			tokens = ['Who'] + tokens[i:]
			return (True, ' '.join(tokens[:-1]) + tokens[-1])

def main():
	print changeToQuestion()

if __name__ == "__main__":
    main()