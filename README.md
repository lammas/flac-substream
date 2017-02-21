# flac-substream

NodeJS module for streaming subsections of FLAC files.
This module is intended to accompany the [flac-seektable](https://github.com/lammas/flac-seektable) module.


## Install

```sh
npm install flac-substream
```

## Usage

The module returns a single function:

```javascript
substream(
	writable,        // A stream.Writable object for the output
	seekdata,        // Metadata object from flac-seektable module
	start,           // Start position (index into seekpoints)
	end,             // End position (index into seekpoints)
	get_read_stream  // Function with signature: (start, end), must return stream.Readable
)
```

The `get_read_stream` function must return a stream.Readable object that provides data from the FLAC file from offset `start` to offset `end`.


```javascript
// Demonstrates the usage to perform random access on a file.
// This is by no means a practical example (most usecases would involve storage of the FLAC metadata beforehand).

const fs = require('fs');
const seektable = require('flac-seektable');
const substream = require('flac-substream');

const FLAC_IN = 'input.flac';
const FLAC_OUT = 'output.flac';
const START_SECONDS = 10;
const END_SECONDS = 20;

var reader = fs.createReadStream(FLAC_IN);
reader.pipe(new seektable(function(data) {
	t.ok(data, 'Got seek data');
	var output = fs.createWriteStream(FLAC_OUT, { flags: 'w' });
	output.on('finish', () => {
		t.pass('Write stream finished');
		t.end();
	});

	substream(output, data, START_SECONDS, END_SECONDS, function(start, end) {
		var stream = fs.createReadStream(
			FLAC_IN,
			{
				start: start,
				end: end
			}
		);
		return stream;
	});
})).pipe(
	devnull() // Or this could go to somewhere useful.
);
```
