var SwipeCards = (function () {
	'use strict';

	/**
	 * Hold all of the default parameters for the module
	 * @type {object}
	 */	
	var defaults = {};

	/**
	 * Hold all of the merged parameter and default module options
	 * @type {object}
	 */
	var options = {};

	var postViews = [];
	var postNodes = [];
	var animationSpeed = 0;
	var isAnimating = false;
	var atFirstPost = true;
	var atLastPost = false;

	/**
	 * Easy shortener for handling adding and removing body classes.
	 */
	var bodyClass = document.body.classList;
	
	/**
	 * Initialize pull to refresh, hammer, and bind drag events.
	 * 
	 * @param {object=} params - Setup parameters for pull to refresh
	 */
	var init = function( params ) {
		params = params || {};
		options = {};

		var h = new Hammer( params.activeEl );

		h.on( 'dragstart', _dragStart );
		h.on( 'dragup', _dragUp );
		h.on( 'dragdown', _dragDown );
		h.on( 'dragend', _dragEnd );
	};

	var _dragStart = function( e ) {

	};

	var _dragUp = function( e ) {

	};
	
	var _dragDown = function( e ) {
		console.log( e.gesture.distance );
	};

	var _dragEnd = function( e ) {

	};

	return {
		init: init
	}

})();