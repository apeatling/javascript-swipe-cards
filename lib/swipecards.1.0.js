// TODO:
// Remove 6 magic number
// Remove animationSpeed magic numbers

var SwipeCards = (function () {
	'use strict';

	var h = {};
	var direction = false;
	var cardEls = {};

	/**
	 * Easy shortener for handling adding and removing body classes.
	 */
	var bodyClass = document.body.classList;
	
	/**
	 * Initialize pull to refresh, hammer, and bind touch events.
	 */
	var init = function() {
		_setCardEls();
		_bindTouchEvents();
	};

	var _bindTouchEvents = function() {
		h = new Hammer( cardEls.active, { preventDefault: true } );

		h.on( 'dragup', _dragUp );
		h.on( 'dragdown', _dragDown );
		h.on( 'dragend', _dragEnd );

		cardEls.before.removeEventListener( 'touchstart', _disableTouch );
		cardEls.active.removeEventListener( 'touchstart', _disableTouch );
		cardEls.after.removeEventListener( 'touchstart', _disableTouch );
	};

	var _unbindTouchEvents = function() {
		h.off( 'dragup', _dragUp );
		h.off( 'dragdown', _dragDown );
		h.off( 'dragend', _dragEnd );

		cardEls.before.addEventListener( 'touchstart', _disableTouch, false );
		cardEls.active.addEventListener( 'touchstart', _disableTouch, false );
		cardEls.after.addEventListener( 'touchstart', _disableTouch, false );
	};

	var _setCardEls = function() {
		cardEls.before = document.getElementsByClassName( 'before' )[0];
		cardEls.active = document.getElementsByClassName( 'active' )[0];
		cardEls.after = document.getElementsByClassName( 'after' )[0];
	};

	var _dragUp = function( e ) {
		var dragDistance = e.gesture.distance,
			distancePercent = Math.round( ( e.gesture.distance / window.innerHeight ) * 100 ),
			opacity = ( distancePercent < 30 ) ? 30 : distancePercent;

		cardEls.active.style.transform = cardEls.active.style.webkitTransform = 'translate3d( 0, -' + dragDistance + 'px, 0 )';
		
		cardEls.after.style.transform = cardEls.after.style.webkitTransform = 'translate3d( 0, ' + ( window.innerHeight - dragDistance ) + 'px, 0 )';
		cardEls.after.style.opacity = '.' + opacity
	};
	
	var _dragDown = function( e ) {
		var dragDistance = e.gesture.distance,
			distancePercent = Math.round( ( e.gesture.distance / window.innerHeight ) * 100 ),
			opacity = ( distancePercent < 30 ) ? 30 : distancePercent;

		cardEls.active.style.transform = cardEls.active.style.webkitTransform = 'translate3d( 0, ' + dragDistance + 'px, 0 )';
		
		cardEls.before.style.transform = cardEls.before.style.webkitTransform = 'translate3d( 0, ' + ( -window.innerHeight + dragDistance ) +  'px, 0 )';
		cardEls.before.style.opacity = '.' + opacity
	};

	var _dragEnd = function( e ) {
		direction = e.gesture.direction;

		// Disable hammer and any touch events until animation is complete.
		_unbindTouchEvents();

		var animationSpeed = ( e.gesture.velocityY > 2.5 ) ? 100 : 250;

		cardEls.active.classList.add( 'animate' );
		cardEls.active.style.transition = 'all ' + animationSpeed + 'ms ease';
		cardEls.before.style.transition = 'all ' + animationSpeed + 'ms ease';
		cardEls.after.style.transition = 'all ' + animationSpeed + 'ms ease';
		
		// Finish the transition after swipe.
		if ( 'up' == direction ) {
			_completeUpTransition( e );
		} else {
			_completeDownTransition( e );
		}

		// When the transition is done shift around the active post.
		cardEls.active.addEventListener( 'transitionend', _shiftActivePost, false );
	};

	var _shiftActivePost = function( e ) {
		cardEls.active.classList.remove( 'animate' );
		
		[ 'animate', 'dragup-reset', 'drag-complete', 'dragup-complete', 'dragdown-reset', 'dragdown-complete' ].forEach( function( c ) {
			bodyClass.remove( c );
		} );
		
		cardEls.before.style.transition = '';
		cardEls.before.style.transform = cardEls.before.style.webkitTransform = '';
		cardEls.before.style.opacity = '';
					
		cardEls.active.style.transition = '';
		cardEls.active.style.transform = cardEls.active.style.webkitTransform = '';
		cardEls.active.style.opacity = '';

		cardEls.after.style.transition = '';
		cardEls.after.style.transform = cardEls.after.style.webkitTransform = '';
		cardEls.after.style.opacity = '';

		cardEls.active.removeEventListener( 'transitionend', _shiftActivePost, false );

		// If the transition to a new post was successful then shift posts
		if ( cardEls.active.classList.contains( 'drag-complete' ) ) {
			if ( 'up' == direction ) {
				cardEls.before.classList.remove( 'before' );
				cardEls.before.classList.add( 'after' );

				cardEls.active.classList.remove( 'active' );
				cardEls.active.classList.remove( 'drag-complete' );
				cardEls.active.classList.add( 'before' );

				cardEls.after.classList.remove( 'after' );
				cardEls.after.classList.add( 'active' );
			} else {
				cardEls.before.classList.remove( 'before' );
				cardEls.before.classList.add( 'active' );

				cardEls.active.classList.remove( 'active' );
				cardEls.active.classList.remove( 'drag-complete' );
				cardEls.active.classList.add( 'after' );

				cardEls.after.classList.remove( 'after' );
				cardEls.after.classList.add( 'before' );					
			}
		}

		// Reselect post nodes
		_setCardEls();

		// re-enable drag events.
		_bindTouchEvents();
	};

	var _completeUpTransition = function( e ) {
		if ( e.gesture.distance < window.innerHeight / 6 ) {
			bodyClass.add( 'dragup-reset' );	
		} else {
			bodyClass.add( 'dragup-complete' )
			cardEls.active.classList.add( 'drag-complete' );
		}
	};

	var _completeDownTransition = function( e ) {
		if ( e.gesture.distance < window.innerHeight / 6 ) {
			bodyClass.add( 'dragdown-reset' );
		} else {
			bodyClass.add( 'dragdown-complete' )
			cardEls.active.classList.add( 'drag-complete' );
		}
	};

	var _disableTouch = function( e ) {
		e.preventDefault();
	};

	return {
		init: init
	}

})();