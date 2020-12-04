let inertia = 0.80
let eq_noise_shift = 20
let eq_noise_amp = 100
let eq_noise_freq = 0.005
let tv_noise_freq = 0.008
let saturationAmp = 140
let lightnessAmp = 120
let saturationShift = 0
let lightnessShift = 0
let colorVariance = 4 // 10 // 10 is high separation, 4 is lower

let cols = 16
let rows = 8
let tvCol = 6
let tvRow = 5

let imgNarrow = []
let imgWide = []
let sprite

let mic, fft
let cellW
let cellH
let spec_step = 2
let spec_min = 200
let windows = []

function setup() {
  frameRate(20)
  randomSeed(0)

	mic = new p5.AudioIn()
	mic.start()
	fft = new p5.FFT()
	fft.setInput(mic)

  let container = select('#container')
  container.style(`grid-template-columns: repeat(${cols}, auto);
                   grid-template-rows: repeat(${rows}, auto);
                  `)
  let containerColor = select('#containerColor')
  containerColor.style(`grid-template-columns: repeat(${cols}, auto);
                   grid-template-rows: repeat(${rows}, auto);
                  `)

  let imgWideCounter = 0
  let imgNarrowCounter = 0

  for (row = 0; row < rows; row += 1) {
    for (col = 0; col < cols; col += 1) {
      let r = floor(random(200) + 200)
      let imgPath
      if (col % 3 == 0) {
        imgPath = windowPaths['wide'][imgWideCounter %
          windowPaths['wide'].length
        ]
        imgWideCounter++
      } else {
        imgPath = windowPaths['narrow'][imgNarrowCounter %
          windowPaths['narrow'].length
        ]
        imgNarrowCounter++
      }

      let windowDivImg = createElement('div')
      windowDivImg.parent('container')
      windowDivImg.class('window')
      windowDivImg.style(`background-image`,
        `url('${imgPath}')`)

      let windowDivColor = createElement('div')
      windowDivColor.parent('containerColor')


      let type_random = random()
      let type
			type = 'equalizer'
      //if (type_random < 0.95) {
        //type = 'equalizer'
      //} else if (type_random < 1.) {
        //type = 'threshold'
      //} else {
        //type = 'equalizer_threshold'
      //}
      if (row == tvRow && col == tvCol) {
        type = 'tv'
        imgPath = windowPaths['wide'][13]
        windowDivImg.style(`background-image`,
          `url('${imgPath}')`)
      }
			//always_on = 'always_on'

      let y = (35 + 20) / 2
      let base = [y, y, y, y, y, y, y, y, y, y, y, 0, 200]
      let spread = 20
      let hue = Math.floor(random(base) + random(-spread, spread))
      let r_ = random()
      let XYCurve = (0.5 + Math.tan((r_ - 0.5) * PI / 1) / colorVariance)
			if(XYCurve > 0.75) XYCurve = 0.75
			if(XYCurve < 0.3) XYCurve = 0.3
      let whitness = random(100)

			console.log(`${ saturationAmp } * ${XYCurve} + ${saturationShift} = ${saturationAmp * XYCurve + saturationShift}`)
			console.log(`${ lightnessAmp } * ${XYCurve} + ${lightnessShift} = ${lightnessAmp * XYCurve + lightnessShift}`)
			console.log('-')

      windowDivColor.style(`background-color`,
        `hsl(
          ${hue},
          ${saturationAmp * XYCurve + saturationShift}%,
          ${lightnessAmp * XYCurve + lightnessShift}%
          )`)

      let window = new Window(
        type,
        row,
        col,
        windowDivColor,
        windowDivImg,
        r,
        r + spec_step,
        random(100),
      )
      windows.push(window)
    }
  }
	noLoop()
}


// Некоторые окна никогда не гаснут. Одно из них с мужиком.
function Window(type = 'equalizer',
  row, col,
  windowDivColor,
  windowDivImg,
  spec_begin,
  spec_end,
  whitness,
) {
  this.type = type
  this.col = col
  this.row = row
  this.windowDivColor = windowDivColor
  this.windowDivImg = windowDivImg

  this.value = 0
  this.lightness = 0
  this.whitness = whitness

  this.update = function(spectrum) {
    this.value *= inertia //inertia
    let amp = 0
    amp = spectrum[spec_begin]

    this.value += 400 * pow(amp, 1) // FIXME
    if (this.value > 200) this.value = 200 // FIXME
  }

  this.draw = function() {
    noiseSeed(random(1000) + this.col)
    let n
    let v
    let r = random()

    switch (type) {
      case 'always_on':
        //this.windowDivColor.style(`background-color`, `white`)
        break

      case 'tv':
        noiseSeed(0)

        t = frameCount / (1 / tv_noise_freq) + 1000
        let h = 512 * (0.5 + 0.5 * Math.sin(10 * noise(t + 100, 100)))
        let s = 25 + 50 * Math.sin(10 * noise(t + 200, 200)) ** 50
        let l = 25 + 50 * Math.sin(10 * noise(t + 300, 300)) ** 50

        this.windowDivColor.style(`background-color`,
          `hsl(
          ${h},
          ${s}%,
          ${l}%
          )`)
        break

      case 'equalizer':
        n = eq_noise_amp * (10 *
          pow(noise(frameCount / (1 / eq_noise_freq) + 1000), 2) -
          4) + eq_noise_shift

        v = this.value // FIXME
        this.lightness = n * 1 + v
        if (this.lightness > 50) this.lightness = 50
        if (this.lightness < 0) this.lightness = 0

        let XYCurve = (0.5 + Math.tan((r - 0.5) * PI / 1) / 10)
				//this.lightness = 50 // FIXME
        //this.windowDivColor.innerHTML = `<div>hello</div>`
        this.windowDivColor.style(`opacity`,
          this.lightness / 50)
        //this.windowDivColor.setAttribute(`v`,
          //v)
        //this.windowDivColor.setAttribute(`n`,
          //n)
        break

      case 'equalizer_threshold':
        n = 100 * (10 *
          pow(noise(frameCount / 200 + 1000), 2) -
          4) + 20

        v = this.value // FIXME
        this.lightness = n + v
        this.lightness = this.lightness < 50 ? 0 : 50

        this.windowDivColor.style(`background-color`,
          `hsl(
          ${this.hue},
          ${100 * (0.5 + Math.tan((r - 0.5) * PI / 1) / 10)}%,
          ${this.lightness}%
          )`)
        break

      case 'threshold':
        n = 100 * (10 *
          pow(noise(frameCount / 8000 + 1000), 2) -
          4) + 20

        this.lightness = n
        this.lightness = this.lightness < 50 ? 0 : 50

        this.windowDivColor.style(`background-color`,
          `hsl(
          ${this.hue},
          ${100 * (0.5 + Math.tan((r - 0.5) * PI / 1) / 10)}%,
          ${this.lightness}%
          )`)
        break
    }

  }

  this.getLightness = function() {
    return this.lightness
  }
}

function specNormalize(spectrum) {
  spectrum.forEach((s, i, a) => {
    a[i] = s * i * 0.001
    a[i] /= 100 // FIXME
  })
  return spectrum
}

function draw() {
  randomSeed(2)
  background(0)

	let spectrum = fft.analyze()
	spectrum = specNormalize(spectrum)

	windows.forEach(w => {
		w.update(spectrum)
		w.draw()
	})
}

document.onkeydown = () => {
	getAudioContext().resume()
	loop()
}
