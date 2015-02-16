from nltk.corpus import ieer
from nltk.sem import relextract
import re

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
for fileid in ieer.fileids():
	for doc in ieer.parsed_docs(fileid):
		for rel in relextract.extract_rels('PER', 'ORG', doc, corpus='ieer', pattern=ROLES):
			print(relextract.rtuple(rel)) 
