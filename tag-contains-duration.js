// Duration Tags v1.00

// Purpose:
// If there is a related tag that matches a duration string the event will be forced to that duration.
// Action Type: Before Event Save 
// Prevent Default Action: No

// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals
var options = {}; var inputs = {};

try {

    //----------- Configuration -------------------

        // Options specified for this action
        
        // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
        options.runTimeout = 0;
        // Array of account emails for whom this action will run. Leave blank to allow the action to run for everyone.
        // Example: ['person@domain.com', 'someone@domain.com']
        options.restrictedToAccounts = [];

        // Any input data for the action should be specified here

		// The string the tag contains to represent a duration
		inputs.contains = 'Duration'; 

		// The label for minutes
		inputs.minutesLabel = 'minutes';

		// The label for hours
		inputs.hoursLabel = 'hours';

		// The position of the contains string (terms are separated by a space)
		inputs.containsPosition = 0;

		// The position of the duration (in minutes or hours)
		inputs.durationPosition = 1;

		// The position of the duration type ('minutes', 'hours')
		inputs.durationTypePosition = 2;

        // The currently signed in account email
        inputs.account = seedcodeCalendar.get('config').account;

    //----------- End Configuration -------------------

}
catch(error) {
    reportError(error);
}



//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {
	// Assign variables
	var eventData = editEvent;
	var eventResources = eventData.resource || [];
	var eventChanges = dbk.eventChanged(editEvent, editEvent.event);

	var tagContains = inputs.contains;

	var matchedTags;
	var keyTag;
	var duration;
	var durationType;

    // Check for required inputs and exit if any are missing or if we don't need to check tags
	if ((!eventChanges && !event.beforeDrop) || !tagContains) {
		return;
	}
	
	// Convert tag list to array if it isn't already
	if (!Array.isArray(tagContains)) {
		tagContains = tagContains.split(",").map(function(item) {
			return item.trim();
		});
	}
	
	// Get any matching tags (returns array of matched tags)
	matchedTags = getMatchingTags(tagContains, eventResources, true);

	if (matchedTags && matchedTags.length) {
		// If there are multiple matches just get the first one
		keyTag = matchedTags[0].name.split(' ');	
		duration = keyTag[inputs.durationPosition];
		durationType = keyTag[inputs.durationTypePosition];
		
		if (durationType === inputs.minutesLabel) {
			durationType === 'minutes';
		}		
		else if (durationType === inputs.hoursLabel) {
			durationType === 'hours';
		}
		else {
			durationType = duration < 5 ? 'hours' : 'minutes';
		}
		
		eventData.end = eventData.start.clone().add(duration, durationType);

		if (eventData._end) {
			eventData._end = eventData.end.clone();
		}
	}

	// -----------------------------
	// Tag matching helper function
	// -----------------------------

	// Function to match tags and return matched tags as array. 
	// Allow parital match will returns tags that contain matching key word. 
	function getMatchingTags(matchTags, matchResources, allowPartialMatch) {
		var tagsResult = [];
		var matchingTags;
		var resources = seedcodeCalendar.get('resources');
		var matchingResources = dbk.objectArrayMatch(matchResources, resources, 'name');
		if (!matchingResources || !matchingResources.length) {
			return [];
		}
	
		for (var i = 0; i < matchingResources.length; i++) {
			matchingTags = dbk.objectArrayMatch(matchTags, matchingResources[i].tags, 'name', allowPartialMatch);
			if (!matchingTags || !matchingTags.length) {
				return [];
			}
			for (var ii = 0; ii < matchingTags.length; ii++) {
				tagsResult.push(matchingTags[ii]);
			}
		}
		return tagsResult;
	}

	//---------------------
	// End matching helper
	// --------------------
}


//----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

// Variables used for helper functions below
var timeout;

// Execute the run function as defined above
try {
    if (!options.restrictedToAccounts || 
        !options.restrictedToAccounts.length || 
        (options.restrictedToAccounts && options.restrictedToAccounts.indexOf(inputs.account) > -1)
    ) {
        if (action.preventDefault && options.runTimeout) {
            timeoutCheck();
        }
        run();
    }
    else if (action.preventDefault) {
        confirmCallback();
    }
}
catch(error) {
    reportError(error);
}

// Run confirm callback when preventDefault is true. Used for async actions
function confirmCallback() {
    cancelTimeoutCheck();
    if (action.callbacks.confirm) {
        action.callbacks.confirm();
    }
}

// Run cancel callback when preventDefault is true. Used for async actions
function cancelCallback() {
    cancelTimeoutCheck();
    if (action.callbacks.cancel) {
        action.callbacks.cancel();
    }
}

// Check if the action has run within the specified time limit when preventDefault is enabled
function timeoutCheck() {
    timeout = setTimeout(function() {
        var error = {
            name: 'Timeout',
            message: 'The action was unable to execute within the allotted time and has been stopped'
        };
        reportError(error, true);
    }, (options && options.runTimeout ? options.runTimeout * 1000 : 0));
}

function cancelTimeoutCheck() {
    if (timeout) {
        clearTimeout(timeout);
    }
}

// Function to report any errors that occur when running this action
// Follows standard javascript error reporter format of an object with name and message properties
function reportError(error) {
    var errorTitle = 'Error Running Custom Action';
    var errorMessage = '<p>There was a problem running the action "<span style="white-space: nowrap">' + action.name + '</span>"</p><p>Error: ' + error.message + '.</p><p>This may result in unexpected behavior of the calendar.</p>'
    if (action.preventDefault && timeout) {
        confirmCallback();
    }
    else {
        cancelCallback();  
    }
    
    setTimeout(function() {
        utilities.showModal(errorTitle, errorMessage, null, null, 'OK', null, null, null, true, null, true);
    }, 1000);
}
