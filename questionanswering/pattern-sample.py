from nltk.corpus import ieer
from nltk.sem import relextract
import re
import nltk
import numpy as np

roles = """
(.*(
analyst|
chair(wo)?man|
commissioner|
counsel|
director|
economist|
editor|
executive|
foreman|
governor|
head|
lawyer|
leader|
librarian).*)|
manager|
partner|
president|
producer|
professor|
researcher|
spokes((wo)?man|person)|
writer|
,\sof\sthe?\s*  # "X, of (the) Y"
"""

ROLES = re.compile(roles, re.VERBOSE)

print "Ask me a question! (try \"Who is the chief counsel for the Electronic Frontier Foundation?\")"
question = raw_input()

print "\nInterpreting your question... "

t = nltk.word_tokenize(question)
t = nltk.pos_tag(t)
entities = nltk.chunk.ne_chunk(t)

desired_subjclass = ''
desired_subjtext = ''
desired_objclass = ''
desired_objtext = ''
for n in entities:
	if isinstance(n, nltk.tree.Tree):
		if n.label() == 'ORGANIZATION':
			desired_objclass = "ORGANIZATION"
			desired_objtext = ' '.join(word for (word, tag) in n.leaves())
	else:
		(word, tag) = n
		if tag == "WP":
			desired_subjclass = "PERSON"


if desired_subjclass != "PERSON":
	print "Sorry, I don't know how to answer that kind of question. "

elif desired_objclass != "ORGANIZATION":
	print "Sorry, I don't know how to look for that answer. "

else:
	evidence = []

	print "Searching for your answer... "

	for fileid in ieer.fileids():
		for doc in ieer.parsed_docs(fileid):
			for rel in relextract.extract_rels('PER', 'ORG', doc, corpus='ieer', pattern=ROLES):
				if rel['objclass'] == "ORGANIZATION" and rel['objtext'] == desired_objtext:
					if rel['subjclass'] == "PERSON":
						desired_subjtext = rel['subjtext']
						evidence.append(rel)
				#print(relextract.rtuple(rel)) 

	if desired_subjtext != "":
		print "\nI've got the answer! The person you're looking for is " + desired_subjtext + ". "
		print "\nHere's some supporting evidence:"
		for e in evidence:
			print "  [...] " + e['lcon'] + " " + e['subjtext'] + " " + e['filler'] + " " + e['objtext'] + " " + e['rcon'] + " [...]"
	else:
		print "Sorry, my search results came up blank. :( "


# Considerations for future improvements
# http://theworldofyesterday.net/2012/11/18/extracting-binary-relationships-from-english-sentences-with-python/
