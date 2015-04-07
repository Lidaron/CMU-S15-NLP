var exec    = require('child_process').exec;
var path    = require('path');
var _       = require('underscore');

function coref(options) {
    this.options = _.extend({
        install_path:   '',
		version:        '3.5.1',
    }, options);
}

coref.prototype.fromFile = function(filename, callback) {
    var scope = this;
    var exec = require('child_process').exec;

	var jars = ["ejml-0.23.jar", "joda-time.jar", "jollyday.jar", "xom.jar", "stanford-corenlp-"+this.options.version+"-models.jar", "stanford-corenlp-"+this.options.version+".jar"];
	for (var i = 0; i < jars.length; i++) {
		jars[i] = path.normalize(this.options.install_path+"/"+jars[i]);
	}
	exec("java -cp \""+jars.join(";")+"\" -Xmx8g edu.stanford.nlp.dcoref.SieveCoreferenceSystem -file "+filename, function(error) {
        if (error) {
            console.log("ERROR:", error);
            return false;
        }
        scope.parse(stdout, callback);
    });
};

module.exports = coref;
