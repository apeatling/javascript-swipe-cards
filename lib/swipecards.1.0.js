// TODO:
// Remove 6 magic number
// Remove animationSpeed magic numbers

var SwipeCards = (function () {
	'use strict';

	var h = {};
	var cardEls = {};
	var direction = false;

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

		for( var card in cardEls ) {
			cardEls[card].removeEventListener( 'touchstart', _disableTouch );
		}
	};

	var _unbindTouchEvents = function() {
		h.off( 'dragup', _dragUp );
		h.off( 'dragdown', _dragDown );
		h.off( 'dragend', _dragEnd );

		for( var card in cardEls ) {
			cardEls[card].addEventListener( 'touchstart', _disableTouch, false );
		}
	};

	var _setCardEls = function() {
		cardEls.before = document.getElementsByClassName( 'before' )[0];
		cardEls.active = document.getElementsByClassName( 'active' )[0];
		cardEls.after = document.getElementsByClassName( 'after' )[0];
	};

	var _dragUp = function( e ) {
		var distancePercent = Math.round( ( e.gesture.distance / window.innerHeight ) * 100 );
		var opacity = ( distancePercent < 30 ) ? 30 : distancePercent;

		cardEls.active.style.transform = cardEls.active.style.webkitTransform = 'translate3d( 0, -' + e.gesture.distance + 'px, 0 )';
		cardEls.after.style.transform  = cardEls.after.style.webkitTransform = 'translate3d( 0, ' + ( window.innerHeight - e.gesture.distance ) + 'px, 0 )';
		cardEls.after.style.opacity = '.' + opacity;
	};
	
	var _dragDown = function( e ) {
		var distancePercent = Math.round( ( e.gesture.distance / window.innerHeight ) * 100 );
		var opacity = ( distancePercent < 30 ) ? 30 : distancePercent;

		cardEls.active.style.transform = cardEls.active.style.webkitTransform = 'translate3d( 0, ' + e.gesture.distance + 'px, 0 )';
		cardEls.before.style.transform = cardEls.before.style.webkitTransform = 'translate3d( 0, ' + ( -window.innerHeight + e.gesture.distance ) +  'px, 0 )';
		cardEls.before.style.opacity = '.' + opacity;
	};

	var _dragEnd = function( e ) {
		direction = e.gesture.direction;

		// Disable hammer and any touch events until animation is complete.
		_unbindTouchEvents();

		var animationSpeed = ( e.gesture.velocityY > 2 ) ? 100 : 200;

		cardEls.active.classList.add( 'animate' );

		for( var card in cardEls ) {
			cardEls[card].style.transition = 'all ' + animationSpeed + 'ms ease';
		}

		// Finish the transition after swipe.
		if ( 'up' === direction ) {
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

		for( var card in cardEls ) {
			cardEls[card].style.transition = '';
			cardEls[card].style.transform = cardEls[card].style.webkitTransform = '';
			cardEls[card].style.opacity = '';
		}

		cardEls.active.removeEventListener( 'transitionend', _shiftActivePost, false );

		// If the transition to a new post was successful then shift posts
		if ( cardEls.active.classList.contains( 'drag-complete' ) ) {
			_setCardClasses();
		}

		// Reselect card elements
		_setCardEls();

		// re-enable drag events.
		_bindTouchEvents();
	};

	var _setCardClasses = function() {
		var beforeCardClass = cardEls.before.classList;
		var activeCardClass = cardEls.active.classList;
		var afterCardClass = cardEls.after.classList;
		
		if ( 'up' === direction ) {
			beforeCardClass.remove( 'before' );
			beforeCardClass.add( 'after' );

			activeCardClass.remove( 'active' );
			activeCardClass.remove( 'drag-complete' );
			activeCardClass.add( 'before' );

			afterCardClass.remove( 'after' );
			afterCardClass.add( 'active' );
		} else {
			beforeCardClass.remove( 'before' );
			beforeCardClass.add( 'active' );

			activeCardClass.remove( 'active' );
			activeCardClass.remove( 'drag-complete' );
			activeCardClass.add( 'after' );

			afterCardClass.remove( 'after' );
			afterCardClass.add( 'before' );					
		}
	};

	var _completeUpTransition = function( e ) {
		if ( e.gesture.distance < window.innerHeight / 6 ) {
			bodyClass.add( 'dragup-reset' );	
		} else {
			bodyClass.add( 'dragup-complete' );
			cardEls.active.classList.add( 'drag-complete' );
		}
	};

	var _completeDownTransition = function( e ) {
		if ( e.gesture.distance < window.innerHeight / 6 ) {
			bodyClass.add( 'dragdown-reset' );
		} else {
			bodyClass.add( 'dragdown-complete' );
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