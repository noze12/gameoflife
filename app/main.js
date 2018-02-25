
const ROOT3 = Math.pow(3, 0.5)
const ROOT1_3 = Math.pow(3, -0.5)
const defaultState = {
  cellsize: 8,
  interval: 100,
  shape: 'square',
  color: 'generation',
  generation: 240,
  survive: "23".split('').map(Number),
  spawn: "3".split('').map(Number),
}
function parseQueryString(queryString) {
  const state = Object.assign({}, defaultState)
  queryString.replace('?', '').split('&').forEach(param => {
    const [key, val] = param.split('=')
    switch (key) {
      case 'cellsize':
        state.cellsize = Number(val)
        break;
      case 'interval':
        state.interval = Number(val)
        break;
      case 'shape':
        if (val === 'square' || val === 'hexagon' || val === 'triangle' ) {
          state.shape = val
        }
        break;
      case 'color':
        if (val === 'generation' || val === 'density') {
          state.color = val
        }
        break;
      case 'survive':
        state.survive = val.split('').map(Number)
        break;
      case 'spawn':
        state.spawn = val.split('').map(Number)
        break;
    }
  })
  return state
}

function mod(n, m) {
  if (n < 0) return n + m
  if (m <= n) return n - m
  return n
}
document.addEventListener('DOMContentLoaded', () => {
  const state = parseQueryString(location.search)
  const clearButton = document.getElementById('clear')
  const stepButton = document.getElementById('step')
  const startButton = document.getElementById('start')
  const stopButton = document.getElementById('stop')
  const speedInput = document.getElementById('speed')
  const sizeInput = document.getElementById('cellsize')
  const shapeSelect = document.getElementById('shape')
  const colorSelect = document.getElementById('color')
  const surviveInput = document.getElementById('survive')
  const spawnInput = document.getElementById('spawn')
  speedInput.value = state.interval
  sizeInput.value = state.cellsize
  shapeSelect.value = state.shape
  colorSelect.value = state.color
  surviveInput.value = state.survive.join('')
  spawnInput.value = state.spawn.join('')
  const fieldElement = document.getElementById('field')
  const canvas = document.createElement('canvas')
  canvas.setAttribute('width', window.innerWidth)
  canvas.setAttribute('height', window.innerHeight)
  fieldElement.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  // 一度fillした領域しかputImageDataでは描けないらしい？
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  let logic = new (logicClass[state.shape])(ctx, state)

  let isMousedonw = false
  canvas.addEventListener('mousedown', e => {
    logic.clicked(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop, 1)
    isMousedonw = true
  })
  canvas.addEventListener('mouseup', () => isMousedonw = false)
  canvas.addEventListener('mousemove', e => {
    if (isMousedonw) {
      logic.clicked(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop)
    }
  })
  clearButton.addEventListener('click', () => logic.clear())
  stepButton.addEventListener('click', () => logic.step())
  let intervalId
  startButton.addEventListener('click', () => {
    if (!intervalId) {
      intervalId = setInterval(() => logic.step(), state.interval)
      startButton.classList.add('hidden')
      stopButton.classList.remove('hidden')
    }
  })
  stopButton.addEventListener('click', () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
      startButton.classList.remove('hidden')
      stopButton.classList.add('hidden')
    }
  })
  speedInput.addEventListener('change', () => {
    state.interval = Number(speedInput.value)
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = setInterval(() => logic.step(), state.interval)
    }
  })
  sizeInput.addEventListener('change', () => {
    state.cellsize = Number(sizeInput.value)
    logic = new (logicClass[state.shape])(ctx, state, logic.cells)
  })
  shapeSelect.addEventListener('change', () => {
    state.shape = shapeSelect.value
    logic = new (logicClass[state.shape])(ctx, state, logic.cells)
  })
  colorSelect.addEventListener('change', () => {
    state.color = colorSelect.value
    logic.redrawAll()
  })
  surviveInput.addEventListener('change', () => {
    state.survive = surviveInput.value.split('').map(Number)
  })
  spawnInput.addEventListener('change', () => {
    state.spawn = spawnInput.value.split('').map(Number)
  })
  document.getElementById('setting-open').addEventListener('click', () => {
    document.getElementById('settings').classList.toggle('hidden')
  })
})

function hueToRgb(H) {
  //https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSL
  // S = 1, L = 0.5
  const Hp = H / 60, X = 1 - Math.abs(Hp % 2 - 1)
  let R, G, B
  if (Hp < 1) [R, G, B] = [1, X, 0]
  else if (Hp < 2) [R, G, B] = [X, 1, 0]
  else if (Hp < 3) [R, G, B] = [0, 1, X]
  else if (Hp < 4) [R, G, B] = [0, X, 1]
  else if (Hp < 5) [R, G, B] = [X, 0, 1]
  else [R, G, B] = [1, 0, X]
  return [Math.floor(R * 255), Math.floor(G * 255), Math.floor(B * 255)]
}
class SquareGameOfLife {
  constructor(ctx, state, oldCells) {
    this.ctx = ctx
    this.globalState = state
    this.cellsize = state.cellsize
    const size = this.getSize()
    this.width = size.width
    this.height = size.height
    const cells = []
    for (let i = 0; i < this.width; i++) {
      cells[i] = []
      for (let j = 0; j < this.height; j++) {
        cells[i][j] = {
          pixels: this.getCellPixels(i, j)
        }
        if (oldCells && oldCells[i] && oldCells[i][j]) {
          cells[i][j].state = oldCells[i][j].state
          cells[i][j].generation = oldCells[i][j].generation
        } else {
          cells[i][j].state = 0
        }
      }
    }
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        cells[i][j].neighbors = this.getNeighbors(i, j).map(([dx, dy]) => {
          return cells[mod(i + dx, this.width)][mod(j + dy, this.height)]
        })
        cells[i][j].score = cells[i][j].neighbors.reduce((m, nei) => m + nei.state, 0)
      }
    }
    this.cells = cells
    this.redrawAll()
  }
  getSize() {
    return {
      width: Math.floor(this.ctx.canvas.width / this.cellsize),
      height: Math.floor(this.ctx.canvas.height / this.cellsize)
    }
  }
  getCellPixels(i, j) {
    const pixels = []
    const start = (this.ctx.canvas.width * j + i) * this.cellsize
    for (let k = 0; k < this.cellsize; k ++) {
      for (let l = 0; l < this.cellsize; l ++) {
        pixels.push(start + this.ctx.canvas.width * k + l)
      }
    }
    return pixels
  }
  clear() {
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        let oldState = this.cells[i][j].state
        this.cells[i][j].state = 0
        this.cells[i][j].score = 0
      }
    }
    this.redrawAll()
  }
  redrawAll() {
    const redraw = []
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        redraw.push(this.cells[i][j])
      }
    }
    this.drawCells(redraw)
  }
  clicked(x, y, toggle) {
    const i = mod(Math.floor(x / this.cellsize), this.width)
    const j = mod(Math.floor(y / this.cellsize), this.height)
    if (toggle && this.cells[i][j].state) {
      this.blankPoint(i, j)
    } else {
      this.fillPoint(i, j)
    }
  }
  blankPoint(i, j) {
    const redraw = []
    if (this.cells[i][j].state) {
      this.cells[i][j].neighbors.forEach(nei => {
        nei.score --
        if (nei.state) {
          redraw.push(nei)
        }
      })
    }
    this.cells[i][j].state = 0
    redraw.push(this.cells[i][j])
    this.drawCells(redraw)
  }
  fillPoint(i, j) {
    const redraw = []
    if (!this.cells[i][j].state) {
      this.cells[i][j].neighbors.forEach(nei => {
        nei.score ++
        if (nei.state) {
          redraw.push(nei)
        }
      })
    }
    this.cells[i][j].state = 1
    this.cells[i][j].generation = this.globalState.generation
    redraw.push(this.cells[i][j])
    this.drawCells(redraw)
  }
  drawCells(cells) {
    const imagaData = this.ctx.getImageData(
      0, 0,
      this.ctx.canvas.width,
      this.ctx.canvas.height
    )
    for (let ci = 0; ci < cells.length; ci ++) {
      let cell = cells[ci], R, G, B
      if (cell.state) {
        if (this.globalState.color === 'generation') {
          [R, G, B] = hueToRgb(cell.generation)
        } else {
          [R, G, B] = hueToRgb(240 - cell.score * 30)
        }
      } else {
        [R, G, B] = [255, 255, 255]
      }
      for (let i = 0; i < cell.pixels.length; i ++) {
        let pos = cell.pixels[i] * 4
        imagaData.data[pos] = R
        imagaData.data[pos + 1] = G
        imagaData.data[pos + 2] = B
      }
    }
    this.ctx.putImageData(imagaData, 0, 0)
  }
  step() {
    const changes = []
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        if (
          this.cells[i][j].state
          && !this.globalState.survive.includes(this.cells[i][j].score)
        ) {
          changes.push(this.cells[i][j])
          this.cells[i][j].state = 0
        } else if (
          !this.cells[i][j].state
          && this.globalState.spawn.includes(this.cells[i][j].score)
        ) {
          changes.push(this.cells[i][j])
          this.cells[i][j].state = 1
          this.cells[i][j].generation = this.globalState.generation
        }
      }
    }
    const redraw = new Set(changes)
    changes.forEach(cell => {
      const scoreChange = cell.state * 2 - 1
      cell.neighbors.forEach(nei => {
        nei.score += scoreChange
        if (this.globalState.color === 'density' && nei.state) {
          redraw.add(nei)
        }
      })
    })
    this.drawCells([...redraw])
    this.globalState.generation = mod(this.globalState.generation + 1, 360)
  }
  getNeighbors() {
    return this.neighbors
  }
}
SquareGameOfLife.prototype.neighbors = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1],
]

class HexagonalGameOfLife extends SquareGameOfLife{
  constructor(ctx, state, oldPoints) {
    super(ctx, state, oldPoints)
  }
  getSize() {
    return {
      width: Math.round(this.ctx.canvas.width / this.cellsize),
      height: Math.round(this.ctx.canvas.height * 2 * ROOT1_3 / this.cellsize)
    }
  }
  clicked(x, y, toggle) {
    const i = mod(Math.floor((x - ROOT1_3 * y) / this.cellsize + 0.75), this.width)
    const j = mod(Math.floor((2 * ROOT1_3 * y) / this.cellsize + 0.75 * ROOT1_3), this.height)
    if (toggle && this.cells[i][j].state) {
      this.blankPoint(i, j)
    } else {
      this.fillPoint(i, j)
    }
  }
  getCellPixels(i, j) {
    const centerX = mod(i + j / 2, this.width) * this.cellsize,
      centerY = mod(ROOT3 / 2 * j, this.height) * this.cellsize,
      minX = Math.max(Math.floor(centerX - this.cellsize / 2), 0),
      maxX = Math.min(
        Math.ceil(centerX + this.cellsize / 2),
        this.ctx.canvas.width
      ),
      minY = Math.max(Math.floor(centerY - ROOT1_3 * this.cellsize), 0),
      maxY = Math.min(
        Math.ceil(centerY + ROOT1_3 * this.cellsize),
        this.ctx.canvas.height
      ),
      fcX = Math.floor(centerX),
      fcY = Math.floor(centerY),
      pixels = []
    for (let x = minX; x < fcX; x++) {
      for (let y = minY; y < fcY; y++) {
        if (
          y - centerY >= -1 * ROOT1_3 * (x - centerX + this.cellsize)
          && x >= centerX - this.cellsize / 2
        ) {
          pixels.push(x + y * this.ctx.canvas.width)
        }
      }
    }
    for (let x = fcX; x < maxX; x++) {
      for (let y = minY; y < fcY; y++) {
        if (
          y - centerY > ROOT1_3 * (x - centerX - this.cellsize)
          && x < centerX + this.cellsize / 2
        ) {
          pixels.push(x + y * this.ctx.canvas.width)
        }
      }
    }
    for (let x = minX; x < fcX; x++) {
      for (let y = fcY; y < maxY; y++) {
        if (
          y - centerY <= ROOT1_3 * (x - centerX + this.cellsize)
          && x >= centerX - this.cellsize / 2
        ) {
          pixels.push(x + y * this.ctx.canvas.width)
        }
      }
    }
    for (let x = fcX; x < maxX; x++) {
      for (let y = fcY; y < maxY; y++) {
        if (
          y - centerY < -1 * ROOT1_3 * (x - centerX - this.cellsize)
          && x < centerX + this.cellsize / 2
        ) {
          pixels.push(x + y * this.ctx.canvas.width)
        }
      }
    }
    return pixels
  }
}
HexagonalGameOfLife.prototype.neighbors = [
            [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0],
]

class TriangleGameOfLife extends SquareGameOfLife {
  constructor(ctx, state, oldPoints) {
    super(ctx, state, oldPoints)
  }
  getSize() {
    return {
      width: Math.round(this.ctx.canvas.width * ROOT3 / 2 / this.cellsize),
      height: Math.round(this.ctx.canvas.height * 2 / this.cellsize)
    }
  }
  clicked(x, y, toggle) {
    const i = mod(Math.floor((x * ROOT3 - y) / 2 / this.cellsize), this.width)
    const j = mod(Math.floor((2 * y) / this.cellsize), this.height)
    if (toggle && this.cells[i][j].state) {
      this.blankPoint(i, j)
    } else {
      this.fillPoint(i, j)
    }
  }
  getCellPixels(i, j) {
    const pixels = []
    if (j % 2 === 0) {
      const leftTopX = mod(i * 2 + j / 2, this.width * 2) * ROOT1_3 * this.cellsize
      const leftTopY = j / 2 * this.cellsize
      const minX = Math.max(Math.floor(leftTopX), 0),
        maxX = Math.min(
          Math.ceil(leftTopX + 2 * ROOT1_3 * this.cellsize),
          this.ctx.canvas.width
        )
      for (let x = minX; x < maxX; x++) {
        for (let y = leftTopY; y < leftTopY + this.cellsize; y++) {
          if (
            y - leftTopY <= ROOT3 * (x - leftTopX)
            && y - leftTopY < 2 * this.cellsize - ROOT3 * (x - leftTopX)
          ) {
            pixels.push(x + y * this.ctx.canvas.width)
          }
        }
      }
    } else {
      const TopX = mod((i + 1) * 2  + (j - 1) / 2, this.width * 2) * ROOT1_3 * this.cellsize
      const TopY = (j - 1) / 2 * this.cellsize
      const minX = Math.max(Math.floor(TopX - ROOT1_3 * this.cellsize), 0),
        maxX = Math.min(
          Math.ceil(TopX + ROOT1_3 * this.cellsize),
          this.ctx.canvas.width
        )
      for (let x = minX; x < maxX; x++) {
        for (let y = TopY; y < TopY + this.cellsize; y++) {
          if (
            y - TopY >= ROOT3 * (x - TopX)
            && y - TopY > - ROOT3 * (x - TopX)
          ) {
            pixels.push(x + y * this.ctx.canvas.width)
          }
        }
      }
    }
    return pixels
  }
  getNeighbors(i, j) {
    if (j % 2 === 0) {
      return this.neighbor_even
    } else {
      return this.neighbor_odd
    }
  }
}
TriangleGameOfLife.prototype.neighbor_even = [
            [0, -2], [1, -2],
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1],
  [-1,  2], [0,  2],
  [-1,  3],
]
TriangleGameOfLife.prototype.neighbor_odd = [
                    [1, -3],
           [0, -2], [1, -2],
           [0, -1], [1, -1],
  [-1, 0],          [1,  0],
  [-1, 1], [0,  1], [1,  1],
  [-1, 2], [0,  2]
]
const logicClass = {
  square: SquareGameOfLife,
  hexagon: HexagonalGameOfLife,
  triangle: TriangleGameOfLife
}
