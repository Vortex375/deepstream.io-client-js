var C = require( '../constants/constants' ),
	utils = require( 'utils' );

/**
 * This object provides a number of methods that allow a rpc provider
 * to respond to a request
 * 
 * @param {Connection} connection - the clients connection object
 * @param {String} name the name of the rpc
 * @param {String} correlationId the correlationId for the RPC
 */
var RpcResponse = function( connection, name, correlationId ) {
	this._connection = connection;
	this._name = name;
	this._correlationId = correlationId;
	this._isAcknowledged = false;
	this._isComplete = false;
	this.autoAck = true;
	utils.nextTick( this._performAutoAck.bind( this ) );
};

/**
 * Acknowledges the receipt of the request. This
 * will happen implicitly unless the request callback
 * explicitly sets autoAck to false
 * 
 * @public
 * @returns 	{void}
 */
RpcResponse.prototype.ack = function() {
	if( this._isAcknowledged === false ) {
		this._connection.sendMsg( C.TOPIC.RPC, C.ACTIONS.ACK, [ this._name, this._correlationId ] );
		this._isAcknowledged = true;
	}
};

/**
 * Reject the request. This might be necessary if the client
 * is already processing a large number of requests. If deepstream
 * receives a rejection message it will try to route the request to
 * another provider - or return a NO_RPC_PROVIDER error if there are no
 * providers left
 * 
 * @public
 * @returns	{void}
 */
RpcResponse.prototype.reject = function() {
	
};

/**
 * Completes the request by sending the response data
 * to the server. If data is an array or object it will
 * automatically be serialised.
 * If autoAck is disabled and the response is send before
 * the ack message the request will still be completed and the
 * ack message ignored
 * 
 * @param {String} data the data send by the provider. Might be JSON serialized
 * 
 * @public
 * @returns {void}
 */
RpcResponse.prototype.send = function( data ) {
	if( this._isComplete === true ) {
		throw new Error( 'Rpc ' + this._name + ' already completed' );
	}
	
	this._connection.sendMsg( C.TOPIC.RPC, C.ACTIONS.RESPONSE, [ this._name, this._correlationId, data ] );
	this._isComplete = true;
};

/**
 * Callback for the autoAck timeout. Executes ack
 * if autoAck is not disabled
 * 
 * @private
 * @returns {void}
 */
RpcResponse.prototype._performAutoAck = function() {
	if( this.autoAck === true ) {
		this.ack();
	}
};

module.exports = RpcResponse;