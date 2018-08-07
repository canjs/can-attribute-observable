var testHelpers = require("../test/helpers");
var behaviors = require("./behaviors");
var canReflect = require("can-reflect");
var AttributeObservable = require("can-attribute-observable");
var domEvents = require("can-dom-events");
var queues = require("can-queues");

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

	testIfRealDocument("select changes value", function(){
		var html = "<select>" +
			"<option value='red'>Red</option>" +
			"<option value='green'>Green</option>" +
		"</select>";

		var div = document.createElement("div");
		div.innerHTML = html;
		var select = div.firstChild;

		var obs = new AttributeObservable(select, "value", {});

		var dispatchedValues = [];
		canReflect.onValue(obs,function(newVal){
			dispatchedValues.push(newVal);
		});

		var ta = this.fixture;
		ta.appendChild(select);

		// INIT TO GREEN
		canReflect.setValue(obs,"green");

		// Now have the user change it to "red"
		canReflect.each(ta.getElementsByTagName('option'), function(opt) {
			if (opt.value === 'red') {
				opt.selected = 'selected';
			}
		});
		domEvents.dispatch(select, "change");

		// It should have dispatched green and red
		// red is most important.  There is probably a bug
		// in that it is not dispatching red.
		QUnit.deepEqual(dispatchedValues,["red"], "dispatched the right events");
	});

	testIfRealDocument("focused set at end of queues (#16)", 5, function(assert) {
		var input = document.createElement("input");
		var otherInput = document.createElement("input");

		var ta = this.fixture;
		ta.appendChild(input);
		ta.appendChild(otherInput);
		otherInput.focus();

		var obs = new AttributeObservable(input, "focused", {});
		assert.notEqual(input, document.activeElement, "not focused");

		assert.equal(obs.get(), false, "observable is false");

		var eventValues = [];
		canReflect.onValue(obs, function(newVal){
			eventValues.push(newVal);
		},"domUI");

		queues.batch.start();
		queues.domUIQueue.enqueue(function(){
			assert.notEqual(input, document.activeElement, "not focused in the DOM UI Queue");
		});
		canReflect.setValue(obs,true);
		queues.batch.stop();

		assert.equal(input, document.activeElement, "focused");

		QUnit.deepEqual(eventValues,[true], "became focused once");
	});
});
