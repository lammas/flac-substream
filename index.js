'use strict';

const Format = require('bin-format');
const bitutils = require('./src/bitutils');

/* Partial FLAC header format.
 * (we only change the number of samples in the data stream)
 */
var FLACStreamInfo = new Format()
	.uint32BE('header')
	.uint16BE('minblocksize')
	.uint16BE('maxblocksize')
	.buffer('minframesize', 3) // uint24
	.buffer('maxframesize', 3) // uint24
	.buffer('data', 8) // uint64
	.buffer('md5', 16);

var FLACHeader = new Format()
	.buffer('signature', 4)
	.nest('streaminfo', FLACStreamInfo)
	.buffer('unparsed', 'eof');


function update_num_samples(headerData, numSamples) {
	var parsed = FLACHeader.parse(headerData);
	var bits = bitutils.bufferToBits(parsed.streaminfo.data);

	var numSamplesBits = bitutils.uintToBits(numSamples, 36);
	for (var i=0; i<numSamplesBits.length; ++i) {
		bits[bits.length - 36 + i] = numSamplesBits[i];
	}

	parsed.streaminfo.data = bitutils.bitsToBuffer(bits);
	return FLACHeader.write(parsed);
}

function subsection(writable, seekdata, start, end, get_read_stream) {
	if (start < 0 || start >= seekdata.seekpoints.length)
		throw new Error('Stream start index out of bounds');
	if (end < 0 || end >= seekdata.seekpoints.length)
		throw new Error('Stream end index out of bounds');
	if (end <= start)
		throw new Error('Stream end index larger or equal to start index');

	var chunkStart = seekdata.seekpoints[start];
	var chunkEnd = seekdata.seekpoints[end];
	var numSamples = chunkEnd.sample - chunkStart.sample;

	var headerReader = get_read_stream(0, seekdata.audio_offset);

	var buffers = [];
	headerReader.on('data', (chunk) => {
		buffers.push(chunk);
	});

	headerReader.on('end', () => {
		var headerData = Buffer.concat(buffers);
		buffers.length = 0;

		headerData = update_num_samples(headerData, numSamples);

		writable.write(headerData);

		var sampleData = get_read_stream(
			seekdata.audio_offset + chunkStart.offset,
			seekdata.audio_offset + chunkEnd.offset
		);

		sampleData.on('end', () => {
			writable.end();
		});

		sampleData.pipe(writable);
	});
}

module.exports = subsection;
