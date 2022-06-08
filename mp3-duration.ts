// Quickly determines the duration of an MP3 file by scanning the headers and summing the
// duration. Based upon the ddsol/mp3-duration npm project in github which can be found at:
// https://github.com/ddsol/mp3-duration/blob/master/index.js. The duration value is the
// same as that displayed by the Chrome player control. Note that when played the duration
// may be a few seconds longer than the value returned here (Chrome also exhibites this
// behavior).
export class MP3Duration {
  private versions = ['2.5', 'x', '2', '1'];
  private layers = ['x', '3', '2', '1'];
  private bitRates: any = {
    'V1Lx': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'V1L1': [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    'V1L2': [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    'V1L3': [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
    'V2Lx': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'V2L1': [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
    'V2L2': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    'V2L3': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    'VxLx': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'VxL1': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'VxL2': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'VxL3': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };
  private sampleRates: any = {
    'x': [0, 0, 0],
    '1': [44100, 48000, 32000],
    '2': [22050, 24000, 16000],
    '2.5': [11025, 12000, 8000]
  };
  private samples: any = {
    x: {
      x: 0,
      1: 0,
      2: 0,
      3: 0
    },
    1: { //MPEGv1,     Layers 1,2,3
      x: 0,
      1: 384,
      2: 1152,
      3: 1152
    },
    2: { //MPEGv2/2.5, Layers 1,2,3
      x: 0,
      1: 384,
      2: 1152,
      3: 576
    }
  };


  skipId3(buffer: Uint8Array) {
    let id3v2Flags, z0, z1, z2, z3, tagSize, footerSize;

    //http://id3.org/d3v2.3.0
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) { //'ID3'
      id3v2Flags = buffer[5];
      footerSize = (id3v2Flags & 0x10) ? 10 : 0;

      //ID3 size encoding is crazy (7 bits in each of 4 bytes)
      z0 = buffer[6];
      z1 = buffer[7];
      z2 = buffer[8];
      z3 = buffer[9];
      if (((z0 & 0x80) === 0) && ((z1 & 0x80) === 0) && ((z2 & 0x80) === 0) && ((z3 & 0x80) === 0)) {
        tagSize = ((z0 & 0x7f) * 2097152) + ((z1 & 0x7f) * 16384) + ((z2 & 0x7f) * 128) + (z3 & 0x7f);
        return 10 + tagSize + footerSize;
      }
    }
    return 0;
  }


  frameSize(samples: any, layer: any, bitRate: any, sampleRate: any, paddingBit: any) {
    if (layer === 1) {
      return (((samples * bitRate * 125 / sampleRate) + paddingBit * 4)) | 0;
    } else { //layer 2, 3
      return (((samples * bitRate * 125) / sampleRate) + paddingBit) | 0;
    }
  }

  parseFrameHeader(header: any) {
    let b1, b2, versionBits, version, simpleVersion, layerBits, layer, bitRateKey;
    let bitRateIndex, bitRate, sampleRateIdx, sampleRate, paddingBit, sample;

    b1 = header[1];
    b2 = header[2];

    versionBits = (b1 & 0x18) >> 3;
    version = this.versions[versionBits];
    simpleVersion = (version === '2.5' ? 2 : version);

    layerBits = (b1 & 0x06) >> 1;
    layer = this.layers[layerBits];

    bitRateKey = 'V' + simpleVersion + 'L' + layer;
    bitRateIndex = (b2 & 0xf0) >> 4;
    bitRate = this.bitRates[bitRateKey][bitRateIndex] || 0;

    sampleRateIdx = (b2 & 0x0c) >> 2;
    sampleRate = this.sampleRates[version][sampleRateIdx] || 0;

    sample = this.samples[simpleVersion][layer];

    paddingBit = (b2 & 0x02) >> 1;
    return {
      bitRate: bitRate,
      sampleRate: sampleRate,
      frameSize: this.frameSize(sample, layer, bitRate, sampleRate, paddingBit),
      samples: sample
    };
  }

  getDurationInSeconds(uintBuffer: Uint8Array) {
    const srcBuffer = new Uint8Array(uintBuffer);
    let offset = this.skipId3(srcBuffer);
    let duration = 0;

    const buffer = [];
    while (offset < srcBuffer.length) {
      let destIdx = 0;
      for (let srcIdx = offset; srcIdx < srcBuffer.length && srcIdx < offset + 10; srcIdx++)
        buffer[destIdx++] = srcBuffer[srcIdx];

      if (destIdx < 10) return duration;

      //Looking for 1111 1111 111X XXXX (frame synchronization bits)
      if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
        const info = this.parseFrameHeader(buffer);
        if (info.frameSize && info.samples) {
          offset += info.frameSize;
          duration += (info.samples / info.sampleRate);
        } else {
          offset++; //Corrupt file?
        }
      } else if (buffer[0] === 0x54 && buffer[1] === 0x41 && buffer[2] === 0x47) {//'TAG'
        offset += 128; //Skip over id3v1 tag size
      } else {
        offset++; //Corrupt file?
      }
    }
    return duration;
  }

  getDurationInHMSString(uintBuffer: Uint8Array) {
    const timeSeconds = Number(this.getDurationInSeconds(uintBuffer));
    const h = Math.floor(timeSeconds / 3600);
    const m = Math.floor(timeSeconds % 3600 / 60);
    const s = Math.floor(timeSeconds % 3600 % 60);

    const mStr = (m < 9 ? "0" : "") + m;
    const sStr = (s < 9 ? "0" : "") + s;
    if (h > 0) {
      return `${h}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
  }
}
