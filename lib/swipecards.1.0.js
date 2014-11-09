// TODO:
// Remove 6 magic number

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

	var h = {};

	var postNodes = {};
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

		_setPostNodes();
		_bindHammerEvents();
	};

	var _bindHammerEvents = function() {
		h = new Hammer( postNodes.active );

		h.on( 'dragstart', _dragStart );
		h.on( 'dragup', _dragUp );
		h.on( 'dragdown', _dragDown );
		h.on( 'dragend', _dragEnd );
	};

	var _unbindHammerEvents = function() {
		h.off( 'dragstart', _dragStart );
		h.off( 'dragup', _dragUp );
		h.off( 'dragdown', _dragDown );
		h.off( 'dragend', _dragEnd );
	};

	var _setPostNodes = function() {
		postNodes.before = document.getElementsByClassName( 'before' )[0];
		postNodes.active = document.getElementsByClassName( 'active' )[0];
		postNodes.after = document.getElementsByClassName( 'after' )[0];
	};

	var _dragStart = function( e ) {
		if ( postNodes.before.length ) {
			atFirstPost = false;
		}

		if ( postNodes.after.length ) {
			atLastPost = false;
		}
	};

	var _dragUp = function( e ) {

		e.gesture.preventDefault();

		this.animationSpeed = ( e.gesture.velocityY > 2.5 ) ? 100 : 250;

		var dragDistance = ( atLastPost ) ? e.gesture.distance / 2.5 : e.gesture.distance,
			distancePercent = Math.round( ( e.gesture.distance / window.innerHeight ) * 100 ),
			opacity = ( distancePercent < 30 ) ? 30 : distancePercent;


		postNodes.active.style.transform = postNodes.active.style.webkitTransform = 'translate3d( 0, -' + dragDistance + 'px, 0 )';
		
		postNodes.after.style.transform = postNodes.active.style.webkitTransform = 'translate3d( 0, ' + ( window.innerHeight - dragDistance ) + 'px, 0 )';
		postNodes.after.style.opacity = '.' + opacity
	};
	
	var _dragDown = function( e ) {
		e.gesture.preventDefault();
		
		animationSpeed = ( e.gesture.velocityY > 2.5 ) ? 100 : 250;

		var dragDistance = ( atFirstPost ) ? e.gesture.distance / 2.5 : e.gesture.distance,
			distancePercent = Math.round( ( e.gesture.distance / window.innerHeight ) * 100 ),
			opacity = ( distancePercent < 30 ) ? 30 : distancePercent;

		postNodes.active.style.transform = postNodes.active.style.webkitTransform = 'translate3d( 0, ' + dragDistance + 'px, 0 )';
		
		postNodes.before.style.transform = postNodes.active.style.webkitTransform = 'translate3d( 0, ' + ( -window.innerHeight + dragDistance ) +  'px, 0 )';
		postNodes.before.style.opacity = '.' + opacity
	};

	var _dragEnd = function( e ) {
		e.gesture.preventDefault();

		var direction = e.gesture.direction;

		// Disable drag events until animation is complete.
		_unbindHammerEvents();

		postNodes.active.classList.add( 'animate' );
		postNodes.active.style.transition = 'all ' + this.animationSpeed + 'ms ease';
		postNodes.before.style.transition = 'all ' + this.animationSpeed + 'ms ease';
		postNodes.after.style.transition = 'all ' + this.animationSpeed + 'ms ease';
		
		// Finish the transition after swipe.
		if ( 'up' == direction ) {
			_completeUpTransition( e );
		} else {
			_completeDownTransition( e );
		}

		// When the transition is done shift around the active post.
		postNodes.active.addEventListener( 'transitionend', function( e ) {
			postNodes.active.classList.remove( 'animate' );
			
			[ 'animate', 'dragup-reset', 'drag-complete', 'dragup-complete', 'dragdown-reset', 'dragdown-complete', 'dragdown-refresh' ].forEach( function( c ) {
				bodyClass.remove( c );
			} );
			
			postNodes.before.style.transition = '';
			postNodes.before.style.transform = postNodes.before.style.webkitTransform = '';
			postNodes.before.style.opacity = '';
						
			postNodes.active.style.transition = '';
			postNodes.active.style.transform = postNodes.active.style.webkitTransform = '';
			postNodes.active.style.opacity = '';

			postNodes.after.style.transition = '';
			postNodes.after.style.transform = postNodes.after.style.webkitTransform = '';
			postNodes.after.style.opacity = '';

			atFirstPost = this.atLastPost = true;
			isAnimating = false;
			postNodes.active.removeEventListener( 'transitionend' );

			// If the transition to a new post was successful then shift posts
			if ( postNodes.active.classList.contains( 'drag-complete' ) ) {
				if ( 'up' == direction ) {
					postNodes.before.classList.remove( 'before' );
					postNodes.before.classList.add( 'after' );

					postNodes.active.classList.remove( 'active' );
					postNodes.active.classList.remove( 'drag-complete' );
					postNodes.active.classList.add( 'before' );


					postNodes.after.classList.remove( 'after' );
					postNodes.after.classList.add( 'active' );
				} else {
					postNodes.before.classList.remove( 'before' );
					postNodes.before.classList.add( 'active' );

					postNodes.active.classList.remove( 'active' );
					postNodes.active.classList.remove( 'drag-complete' );
					postNodes.active.classList.add( 'after' );

					postNodes.after.classList.remove( 'after' );
					postNodes.after.classList.add( 'before' );					
				}
			}

			// Reselect post nodes
			_setPostNodes();

			// re-enable drag events.
			_bindHammerEvents();

		}, false );
	};

	var _completeUpTransition = function( e ) {
		if ( atLastPost || e.gesture.distance < window.innerHeight / 6 ) {
			bodyClass.add( 'dragup-reset' );	
		} else {
			bodyClass.add( 'dragup-complete' )
			postNodes.active.classList.add( 'drag-complete' );
		}
	};

	var _completeDownTransition = function( e ) {
		if ( atFirstPost || e.gesture.distance < window.innerHeight / 6 ) {
			bodyClass.add( 'dragdown-reset' );
		} else {
			bodyClass.add( 'dragdown-complete' )
			postNodes.active.classList.add( 'drag-complete' );
		}
	};

	return {
		init: init
	}

})();