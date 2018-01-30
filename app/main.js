
const DEFALUT_CELLSIZE = 15
const DEFAULT_INTERVAL = 100
const DEFAULT_SHAPE = 'rect'
const DEFAULT_COLOR = 240
const DEFAULT_SURVIVE = "23"
const DEFAULT_SPAWN = "3"
const ROOT3 = Math.pow(3, 0.5)
const ROOT1_3 = Math.pow(3, -0.5)

document.addEventListener('DOMContentLoaded', () => {
  const clearButton = document.getElementById('clear')
  const stepButton = document.getElementById('step')
  const startButton = document.getElementById('start')
  startButton.textContent = 'start'
  const speedInput = document.getElementById('interval')
  speedInput.setAttribute('value', DEFAULT_INTERVAL)
  const sizeInput = document.getElementById('size')
  sizeInput.setAttribute('value', DEFALUT_CELLSIZE)
  const shapeSelect = document.getElementById('shape')
  shapeSelect.setAttribute('value', DEFAULT_SHAPE)
  const fieldElement = document.getElementById('field')
  const canvas = document.createElement('canvas')
  canvas.setAttribute('width', window.innerWidth)
  canvas.setAttribute('height', window.innerHeight)
  fieldElement.appendChild(canvas)
  const ctx = canvas.getContext('2d');
  let logic = new (logicClass[DEFAULT_SHAPE])(ctx, DEFALUT_CELLSIZE, DEFAULT_COLOR)
  logic.survive = DEFAULT_SURVIVE.split('').map(v => Number(v))
  logic.spawn = DEFAULT_SPAWN.split('').map(v => Number(v))
  const surviveInput = document.getElementById('survive')
  surviveInput.value = DEFAULT_SURVIVE
  const spawnInput = document.getElementById('spawn')
  spawnInput.value = DEFAULT_SPAWN

  let isMousedonw = false
  canvas.addEventListener('mousedown', e => {
    logic.clicked(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop)
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
  let interval = DEFAULT_INTERVAL
  let intervalId
  startButton.addEventListener('click', () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
      startButton.textContent = 'start'
    } else {
      intervalId = setInterval(() => logic.step(), interval)
      startButton.textContent = 'stop'
    }
  })
  speedInput.addEventListener('change', () => {
    interval = speedInput.value
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = setInterval(() => logic.step(), interval)
    }
  })
  sizeInput.addEventListener('change', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    logic = new (logicClass[shapeSelect.value])(
      ctx, Number(sizeInput.value), logic.color, logic.points
    )
    logic.survive = surviveInput.value.split('').map(v => Number(v))
    logic.spawn = spawnInput.value.split('').map(v => Number(v))
  })
  shapeSelect.addEventListener('change', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    logic = new (logicClass[shapeSelect.value])(
      ctx, Number(sizeInput.value), logic.color, logic.points
    )
    logic.survive = surviveInput.value.split('').map(v => Number(v))
    logic.spawn = spawnInput.value.split('').map(v => Number(v))
  })
  surviveInput.addEventListener('change', () => {
    logic.survive = surviveInput.value.split('').map(v => Number(v))
  })
  spawnInput.addEventListener('change', () => {
    logic.spawn = spawnInput.value.split('').map(v => Number(v))
  })
})
function mod(n, m) {
  if (n < 0) return n + m
  if (m <= n) return n - m
  return n
}
class ConwayGameOfLife {
  constructor(ctx, cellsize, color, oldPoints) {
    this.ctx = ctx
    this.cellsize = cellsize
    const size = this.getSize()
    this.width = size.width
    this.height = size.height
    this.color = color
    this.points = []
    this.paths = []
    for (let i = 0; i < this.width; i++) {
      this.points[i] = []
      this.paths[i] = []
      for (let j = 0; j < this.height; j++) {
        this.paths[i][j] = this.getCellPath(i, j)
        if (oldPoints && oldPoints[i] && oldPoints[i][j]) {
          this.fillPoint(i, j)
        } else {
          this.points[i][j] = 0
        }
      }
    }
  }
  getSize() {
    return {
      width: Math.floor(this.ctx.canvas.width / this.cellsize),
      height: Math.floor(this.ctx.canvas.height / this.cellsize)
    }
  }
  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.points = []
    for (let i = 0; i < this.width; i++) {
      this.points[i] = []
      for (let j = 0; j < this.height; j++) {
        this.points[i][j] = 0
      }
    }
  }
  clicked(x, y) {
    this.fillPoint(
      mod(Math.floor(x / this.cellsize), this.width),
      mod(Math.floor(y / this.cellsize), this.height)
    )
  }
  blankPoint(i, j) {
    this.points[i][j] = 0
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fill(this.paths[i][j])
  }
  fillPoint(i, j) {
    this.points[i][j] = 1
    this.ctx.fillStyle = `hsl(${this.color}, 100%, 50%)`
    this.ctx.fill(this.paths[i][j])
  }
  getCellPath(i, j) {
    const path = new Path2D()
    path.moveTo(i * this.cellsize, j * this.cellsize)
    path.lineTo((i + 1) * this.cellsize, j * this.cellsize)
    path.lineTo((i + 1) * this.cellsize, (j + 1) * this.cellsize)
    path.lineTo(i * this.cellsize, (j + 1) * this.cellsize)
    path.closePath()
    return path
  }
  togglePoint(i, j) {
    if (this.points[i][j]) {
      this.blankPoint(i, j)
    } else {
      this.fillPoint(i, j)
    }
  }
  step() {
    const changes = []
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        const sum = this.getNeighbors(i, j).reduce((m, [dx, dy]) => {
          const x = mod(i + dx, this.width)
          const y = mod(j + dy, this.height)
          return this.points[x][y] + m
        }, 0)
        if (this.points[i][j] && !this.survive.includes(sum)) {
          changes.push([i, j])
        } else if (!this.points[i][j] && this.spawn.includes(sum)) {
          changes.push([i, j])
        }
      }
    }
    changes.forEach(([i, j]) => this.togglePoint(i, j))
    this.color = mod(this.color + 1, 360)
  }
  getNeighbors() {
    return this.neighbors
  }
}
ConwayGameOfLife.prototype.neighbors = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1],
]
ConwayGameOfLife.prototype.survive = [2, 3]
ConwayGameOfLife.prototype.spawn = [3]

class HexGameOfLife extends ConwayGameOfLife{
  constructor(ctx, cellsize, color, oldPoints) {
    super(ctx, cellsize, color, oldPoints)
  }
  getSize() {
    return {
      width: Math.round(this.ctx.canvas.width / this.cellsize),
      height: Math.round(this.ctx.canvas.height * 2 * ROOT1_3 / this.cellsize)
    }
  }
  blankPoint(i, j) {
    this.points[i][j] = 0
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fill(this.paths[i][j])
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#ffffff'
    this.ctx.stroke(this.paths[i][j])
  }
  clicked(x, y) {
    const i = mod(Math.floor((x - ROOT1_3 * y) / this.cellsize + 0.75), this.width)
    const j = mod(Math.floor((2 * ROOT1_3 * y) / this.cellsize + 0.75 * ROOT1_3), this.height)
    this.fillPoint(i, j)
  }
  getCellPath(i, j) {
    const centerX = mod(i + j / 2, this.width) * this.cellsize
    const centerY = mod(ROOT3 / 2 * j, this.height) * this.cellsize
    const path = new Path2D()
    path.moveTo(centerX, centerY - ROOT1_3 * this.cellsize)
    path.lineTo(centerX + this.cellsize / 2, centerY - ROOT1_3 / 2 * this.cellsize)
    path.lineTo(centerX + this.cellsize / 2, centerY + ROOT1_3 / 2 * this.cellsize)
    path.lineTo(centerX, centerY + ROOT1_3 * this.cellsize)
    path.lineTo(centerX - this.cellsize / 2, centerY + ROOT1_3 / 2 * this.cellsize)
    path.lineTo(centerX - this.cellsize / 2, centerY - ROOT1_3 / 2 * this.cellsize)
    path.closePath()
    return path
  }
}
HexGameOfLife.prototype.neighbors = [
            [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0],
]
HexGameOfLife.prototype.survive = [3, 4]
HexGameOfLife.prototype.spawn = [2]

class TriangleGameOfLife extends ConwayGameOfLife{
  constructor(ctx, cellsize, color, oldPoints) {
    super(ctx, cellsize, color, oldPoints)
  }
  getSize() {
    return {
      width: Math.round(this.ctx.canvas.width * ROOT3 / 2 / this.cellsize),
      height: Math.round(this.ctx.canvas.height * 2 / this.cellsize)
    }
  }
  blankPoint(i, j) {
    this.points[i][j] = 0
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fill(this.paths[i][j])
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#ffffff'
    this.ctx.stroke(this.paths[i][j])
  }
  clicked(x, y) {
    const i = mod(Math.floor((x * ROOT3 - y) / 2 / this.cellsize), this.width)
    const j = mod(Math.floor((2 * y) / this.cellsize), this.height)
    this.fillPoint(i, j)
  }
  getCellPath(i, j) {
    const path = new Path2D()
    if (j % 2 === 0) {
      const leftTopX = mod(i * 2 + j / 2, this.width * 2)  * ROOT1_3 * this.cellsize
      const leftTopY = j / 2 * this.cellsize
      path.moveTo(leftTopX, leftTopY)
      path.lineTo(leftTopX + 2 * ROOT1_3 * this.cellsize, leftTopY)
      path.lineTo(leftTopX + ROOT1_3 * this.cellsize, leftTopY + this.cellsize)
    } else {
      const TopX = mod((i + 1) * 2  + (j - 1) / 2, this.width * 2) * ROOT1_3 * this.cellsize
      const TopY = (j - 1) / 2 * this.cellsize
      path.moveTo(TopX, TopY)
      path.lineTo(TopX - ROOT1_3 * this.cellsize, TopY + this.cellsize)
      path.lineTo(TopX + ROOT1_3 * this.cellsize, TopY + this.cellsize)
    }
    path.closePath()
    return path
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
TriangleGameOfLife.prototype.survive = [3, 4, 5]
TriangleGameOfLife.prototype.spawn = [4]
const logicClass = {
  rect: ConwayGameOfLife,
  hex: HexGameOfLife,
  tri: TriangleGameOfLife
}
