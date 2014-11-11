/*! JavaScript Swipe Cards
 * https://github.com/apeatling/javascript-swipe-cards
 *
 * Copyright (c) 2014 Andy Peatling <apeatling@gmail.com>;
 * Licensed under the MIT license */
 
var SwipeCards = (function () {
    'use strict';

    /** 
     * @constant The speed cards will animate to completion with a fast drag
     * @type {number}
     */
    var ANIMATION_SPEED_FAST = 200;

    /** 
     * @constant The speed cards will animate to completion with a slow drag
     * @type {number}
     */
    var ANIMATION_SPEED_SLOW = 100;

    /** 
     * @constant The boundary to determine a fast or slow drag 0 (slow) to 3+ (very fast)
     * @type {number}
     */
    var DRAG_VELOCITY_BOUNDARY = 2;

    /** 
     * @constant Fraction of the viewport to drag past to auto complete a card transition
     * @type {number}
     */
    var DRAG_WINDOW_FRACTION = 6;

    /**
     * Hold the hammer.js object
     * @type {object}
     */ 
    var h = {};

    /**
     * The before, active, and after card DOM elements
     * @type {object}
     */     
    var cardEls = {};

    /**
     * The current drag direction from user input
     * @type {string}
     */ 
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

    /**
     * Initialize the hammer.js class, and bind drag events.
     */
    var _bindTouchEvents = function() {
        h = new Hammer( cardEls.active, { preventDefault: true } );

        h.on( 'dragup', _dragUp );
        h.on( 'dragdown', _dragDown );
        h.on( 'dragend', _dragEnd );

        // While drag events are active, make sure touch events are accessible.
        for( var card in cardEls ) {
            cardEls[card].removeEventListener( 'touchstart', _disableTouch );
        }
    };

    /**
     * Unbind hammer.js drag events.
     */
    var _unbindTouchEvents = function() {
        h.off( 'dragup', _dragUp );
        h.off( 'dragdown', _dragDown );
        h.off( 'dragend', _dragEnd );

        // While drag events are not active, block all touch events to stop scrolling.
        for( var card in cardEls ) {
            cardEls[card].addEventListener( 'touchstart', _disableTouch, false );
        }
    };

    /**
     * Select the card elements from the DOM and store them in cardEls for easy access.
     */
    var _setCardEls = function() {
        cardEls.before = document.getElementsByClassName( 'before' )[0];
        cardEls.active = document.getElementsByClassName( 'active' )[0];
        cardEls.after = document.getElementsByClassName( 'after' )[0];
    };

    /**
     * On the dragup event, transform the active and after card elements to move
     * with the drag.
     */
    var _dragUp = function( e ) {
        var distancePercent = Math.round( ( e.gesture.distance / window.innerHeight ) * 100 );
        var opacity = ( distancePercent < 30 ) ? 30 : distancePercent;

        cardEls.active.style.transform = cardEls.active.style.webkitTransform = 'translate3d( 0, -' + e.gesture.distance + 'px, 0 )';
        cardEls.after.style.transform  = cardEls.after.style.webkitTransform = 'translate3d( 0, ' + ( window.innerHeight - e.gesture.distance ) + 'px, 0 )';
        cardEls.after.style.opacity = '.' + opacity;
    };

    /**
     * On the dragdown event, transform the active and before card elements
     * to move with the drag.
     */ 
    var _dragDown = function( e ) {
        var distancePercent = Math.round( ( e.gesture.distance / window.innerHeight ) * 100 );
        var opacity = ( distancePercent < 30 ) ? 30 : distancePercent;

        cardEls.active.style.transform = cardEls.active.style.webkitTransform = 'translate3d( 0, ' + e.gesture.distance + 'px, 0 )';
        cardEls.before.style.transform = cardEls.before.style.webkitTransform = 'translate3d( 0, ' + ( -window.innerHeight + e.gesture.distance ) +  'px, 0 )';
        cardEls.before.style.opacity = '.' + opacity;
    };

    /**
     * On the dragend event, determine if the drag animation should slide
     * the next card in, or restore the active card.
     */
    var _dragEnd = function( e ) {
        direction = e.gesture.direction;

        // Disable hammer and any touch events until animation is complete.
        _unbindTouchEvents();

        var animationSpeed = ( e.gesture.velocityY > DRAG_VELOCITY_BOUNDARY ) ? ANIMATION_SPEED_SLOW : ANIMATION_SPEED_FAST;

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

        // When the transition is done shift around the active card.
        cardEls.active.addEventListener( 'transitionend', _shiftActiveCard, false );
    };

    /**
     * Change the active card class if the transition was a success.
     */
    var _shiftActiveCard = function( e ) {
        cardEls.active.classList.remove( 'animate' );
        
        [ 'animate', 'dragup-reset', 'drag-complete', 'dragup-complete', 'dragdown-reset', 'dragdown-complete' ].forEach( function( c ) {
            bodyClass.remove( c );
        } );

        for( var card in cardEls ) {
            cardEls[card].style.transition = '';
            cardEls[card].style.transform = cardEls[card].style.webkitTransform = '';
            cardEls[card].style.opacity = '';
        }

        cardEls.active.removeEventListener( 'transitionend', _shiftActiveCard, false );

        // If the transition to a new card was successful then shift cards
        if ( cardEls.active.classList.contains( 'drag-complete' ) ) {
            _setCardClasses();
        }

        // Reselect card elements and their new classes.
        _setCardEls();

        _bindTouchEvents();
    };

    /**
     * Set the classes on each card, depending on the completed drag direction.
     */
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

    /**
     * Add the correct class to the body, depending on if the drag was completed or not.
     */
    var _completeUpTransition = function( e ) {
        if ( e.gesture.distance < window.innerHeight / DRAG_WINDOW_FRACTION ) {
            bodyClass.add( 'dragup-reset' );    
        } else {
            bodyClass.add( 'dragup-complete' );
            cardEls.active.classList.add( 'drag-complete' );
        }
    };

    var _completeDownTransition = function( e ) {
        if ( e.gesture.distance < window.innerHeight / DRAG_WINDOW_FRACTION ) {
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