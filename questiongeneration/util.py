# Util functions and definitions used to generate questions
# 
# Allows us to determine basic information quickly
#
# Alexis Larry


# Time
months = set(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sept',
          'oct', 'nov', 'dec', 'january', 'february', 'march', 'april',
          'june', 'july', 'august', 'septemeber', 'october', 'november',
          'december'])
days = set(['mon', 'tues', 'wed', 'thur', 'thu', 'fri', 'sat', 'sun', 'monday',
        'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
timeReference = set(['weekday', 'weekend', 'yesterday', 'today', 'tomorrow'])


# Pronoun
# taken from http://www.englisch-hilfen.de/en/grammar/pronomen.html
subjectPronoun = set(['he', 'she', 'i', 'we', 'they'])
objectPronoun = set(['me', 'you', 'him', 'her', 'us', 'them'])
possessivePronoun = set(['mine', 'yours', 'his', 'hers', 'ours', 'theirs'])

# Verbs
existVerbs = set(['are', 'is', 'was', 'were'])


# Part of speech checking functions
def isNoun(tag):
    return tag[:1] == 'N'
   
def isAdj(tag):
    return tag[:2] == 'JJ'
      
def isPronoun(tag):
    return tag[:2] == 'PR'
               
def isNum(tag):
    return tag[:2] == 'CD'
                 
def isVerb(tag):
    return tag[:1] == 'V'
                    
def isProperNoun(tag):
    return tag == 'NNP'

def isAdverb(tag):
    return tag == 'RB'
    
def isDet(tag):
    return tag == 'DT'
    

def isPerson(ner):
    return ner == 'PERSON'
    
def isExistVerb(token):
    return token in existVerbs
    
def isSubjectPronoun(token):
    return token in subjectPronoun

def isObjectPronoun(token):
    return token in objectPronoun

def isPossessivePronoun(token):
    return token in possessivePronoun

