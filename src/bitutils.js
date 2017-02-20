'use strict';

function uintToBits(n, numBits) {
	numBits = numBits || 32;
	var a = [];
	for (var i=numBits-1; i>=0; i--) {
		a.push((n & (1 << i)) > 0 ? 1 : 0);
	}
	return a;
}

function uintFromBits(bitArray) {
	var n = 0;
	for (var i=0; i<bitArray.length; i++) {
		if (bitArray[i] == 0)
			continue;
		n |= (1 << (bitArray.length - 1 - i));
	}
	return n;
}

function bufferToBits(buffer) {
	var bits = [];
	for (var i = 0; i < buffer.length; ++i) {
		var byte = buffer[i];
		for (var bit = 7; bit >= 0; --bit) {
			bits.push( byte & (1 << bit) ? 1 : 0 );
		}
	}
	return bits;
}

function bitsToBuffer(bits) {
	if (bits.length % 8 != 0)
		throw new Error('bitsToBuffer: bit array must be divisible by 8');

	var buffer = Buffer.alloc(bits.length / 8, 0);
	var idx = 0;
	for (var i=0; i<bits.length; i+=8) {
		var val = uintFromBits(bits.slice(i, i+8));
		buffer[idx++] = val;
	}
	return buffer;
}

module.exports = {
	uintToBits: uintToBits,
	uintFromBits: uintFromBits,
	bufferToBits: bufferToBits,
	bitsToBuffer: bitsToBuffer
};
