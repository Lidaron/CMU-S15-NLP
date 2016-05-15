# Takes in a sentence and generates a question if possible.


# Cases handled:
# when - need date ner
# where - 
# who - done
# what
# why
# yes/no - done

import nltk
import sys

from nltk.tag.stanford import NERTagger
from util import *

def lowerIfPossible(token):
    upperTag = nltk.pos_tag([token])
    lowerTag = nltk.pos_tag([token.lower()])
    if upperTag[0][1] == lowerTag[0][1]:
        return token.lower()
    if isAdverb(upperTag[0][1]) or isAdverb(lowerTag[0][1]):
        return token.lower()
    return token

# removes extra determiner from before question word
# position is at the verb
def removeDeterminer(tokens, pos, position):
    if position > 1 and isDet(pos[position-2][1]):
        tokens.pop(position-2)
        pos.pop(position-2)
        return (tokens, pos, position-1)
    return (tokens, pos, position)

# move verb to the front of question
def cleanYesNo(tokens, pos, position):
    # split sentence into before verb and after verb
    bVerb = []
    aVerb = []
    if position > 0:
        bVerb = tokens[:position]
        bVerb[0] = lowerIfPossible(bVerb[0])
    if position < len(tokens)-1:
        aVerb = tokens[position+1:];
    return (True, [tokens[position]] + tokens[:position] + tokens[position+1:])

# handles cases where name is more than 1 word
def handleProperNoun(tokens, pos, position):
    st = NERTagger('../stanford-ner/classifiers/english.all.3class.distsim.crf.ser.gz',
        '../stanford-ner/stanford-ner.jar')

    # get tokens & pos before verb
    bTokens = tokens[:position]
    bPos = pos[:position]
    ner = st.tag(bTokens)
   
    # reverse everything now
    ner = ner[::-1]
    bPos = bPos[::-1]
  
    person = False

    i = -1
    if isProperNoun(bPos[0][1]) and isPerson(ner[0][1]):
        i = 0
        person = True
        while(i < len(bPos) and isProperNoun(bPos[i][1]) and isPerson(ner[i][1])):
            i = i + 1

    elif isProperNoun(bPos[0][1]):
        i = 0
        while(i < len(bPos) and isProperNoun(bPos[i][1])):
            i = i + 1

    # Reverse back and remove extra
    ner = ner[::-1]
    if (i > -1):
        for r in range(1, i):
            tokens.pop(len(bTokens)-i)
            pos.pop(len(bTokens)-i)
            position = position -1
    if person:
        tokens[position-1] = 'who'
    else:
        tokens[position-1] = 'what'
    return(tokens, pos, position)

def replaceWhoOrWhat(tokens, pos, tag, position):
    if isProperNoun(tag[1]):
        (tokens, pos, position) = handleProperNoun(tokens, pos, position)           # handle organization
    elif isPronoun(tag[1]):
        if isSubjectPronoun(tag[0]):
            tokens[position-1] = 'who'
        elif isObjectPronoun(tag[0]):
            tokens[position-1] = 'whom'
        elif tag[0] == 'it':
            tokens[position-1] = 'what'
        else:
            return (False, None)
    else:                                            # a regular noun 
        tokens[position] = 'what'
    return cleanResult(tokens, pos, tag, position)

def cleanResult(tokens, pos, tag, position):
    (tokens, pos, position) = removeDeterminer(tokens, pos, position)
    return (True, tokens)

def generate(word):
    sentence = word

    st = NERTagger('../stanford-ner/classifiers/english.all.3class.distsim.crf.ser.gz',
       '../stanford-ner/stanford-ner.jar')

    tokens = nltk.word_tokenize(sentence)
    pos = nltk.pos_tag(tokens)
    ner = st.tag(tokens)

    # TODO: Add in the question mark at the end of the sentence
    (success, question) = simpleYesNo(tokens, pos)
    if success:
        return question

    (success, question) = simpleWhoOrWhat(tokens, pos)
    if success:
        return question

    return None

def simpleYesNo(tokens, pos):
    seen = False 
    for i,tag in enumerate(pos):
        if isVerb(tag[1]):
            if isExistVerb(tag[0]) and not seen:                     # First verb is exist verb 
                return cleanYesNo(tokens, pos, i)
            seen = True
    return (False, None)

def simpleWhoOrWhat(tokens, pos):
    # look for a noun before the first verb
    # TODO: generate using other verb other than 1st
    last_noun = None
    for i, tag in enumerate(pos):
        if isNoun(tag[1]) or isPronoun(tag[1]):
            last_noun = tag
        if isVerb(tag[1]) and last_noun is not None:
            return replaceWhoOrWhat(tokens, pos, last_noun, i)
    return (False, None)

def simpleWhen(tokens, po):
    pass

def main():
    sentence = ''
    for i in range(1, len(sys.argv)):
        sentence = sentence + sys.argv[i] + ' '
    print generate(sentence)

if __name__ == "__main__":
    main()
