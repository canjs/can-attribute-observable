var testHelpers = require("../test/helpers");
var behaviors = require("./behaviors");

var mock = function(obj, fnName) {
	var origFn = obj[fnName];

	obj[fnName] = function() {
		var out = "";

		for (var i=0; i<arguments.length; i++) {
			out += arguments[i].toString();
		}

		return out;
	};

	return function unmock() {
		obj[fnName] = origFn;
	};
};

testHelpers.makeTests("AttributeObservable - behaviors", function(
	name,
	doc,
	enableMO,
	testIfRealDocument
) {
	testIfRealDocument("getRule", function(assert) {
		var input = doc.createElement("input");
		var video = doc.createElement("video");
		var circle = doc.createElementNS("http://www.w3.org/2000/svg", "circle");

		// clear out cached rules using real behaviors methods
		behaviors.rules.clear();

		// mock functions
		var unmockProperty = mock( behaviors, "property" );
		var unmockAttribute = mock( behaviors, "attribute" );

		[{
			el: input,
			attrOrPropName: "value",
			expectedRule: behaviors.specialAttributes.value
		}, {
			el: video,
			attrOrPropName: "currentTime",
			expectedRule: behaviors.property("currentTime")
		}, {
			el: circle,
			attrOrPropName: "r",
			expectedRule: behaviors.attribute("r")
		}].forEach(function(testCase) {
			assert.equal(
				behaviors.getRule(testCase.el, testCase.attrOrPropName),
				testCase.expectedRule,
				testCase.el + " " + testCase.attrOrPropName);
		});

		unmockProperty();
		unmockAttribute();

		// clear out cached rules using mock behaviors methods
		behaviors.rules.clear();
	});
});
