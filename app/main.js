
const DEFALUT_CELLSIZE = 15
const DEFAULT_INTERVAL = 100
const DEFAULT_SHAPE = 'rect'
const DEFAULT_COLOR = 'generation'
const DEFAULT_GEN_COLOR = 240
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
  const colorSelect = document.getElementById('color')
  colorSelect.setAttribute('value', DEFAULT_COLOR)
  const fieldElement = document.getElementById('field')
  const canvas = document.createElement('canvas')
  canvas.setAttribute('width', window.innerWidth)
  canvas.setAttribute('height', window.innerHeight)
  fieldElement.appendChild(canvas)
  const ctx = canvas.getContext('2d');
  let logic = new (logicClass[DEFAULT_SHAPE])(ctx, DEFALUT_CELLSIZE, DEFAULT_GEN_COLOR)
  logic.survive = DEFAULT_SURVIVE.split('').map(v => Number(v))
  logic.spawn = DEFAULT_SPAWN.split('').map(v => Number(v))
  const surviveInput = document.getElementById('survive')
  surviveInput.value = DEFAULT_SURVIVE
  const spawnInput = document.getElementById('spawn')
  spawnInput.value = DEFAULT_SPAWN

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
      ctx, Number(sizeInput.value), logic.color, logic.cells
    )
    logic.survive = surviveInput.value.split('').map(v => Number(v))
    logic.spawn = spawnInput.value.split('').map(v => Number(v))
  })
  shapeSelect.addEventListener('change', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    logic = new (logicClass[shapeSelect.value])(
      ctx, Number(sizeInput.value), logic.color, logic.cells
    )
    logic.survive = surviveInput.value.split('').map(v => Number(v))
    logic.spawn = spawnInput.value.split('').map(v => Number(v))
  })
  shapeSelect.addEventListener('change', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    logic = new (logicClass[shapeSelect.value])(
      ctx, Number(sizeInput.value), logic.color, logic.cells
    )
    logic.survive = surviveInput.value.split('').map(v => Number(v))
    logic.spawn = spawnInput.value.split('').map(v => Number(v))
  })
  colorSelect.addEventListener('change', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const color = colorSelect.value === 'generation' ? DEFAULT_GEN_COLOR : null
    logic = new (logicClass[shapeSelect.value])(
      ctx, Number(sizeInput.value), color, logic.cells
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
  constructor(ctx, cellsize, color, oldCells) {
    this.ctx = ctx
    this.cellsize = cellsize
    const size = this.getSize()
    this.width = size.width
    this.height = size.height
    this.color = color
    const cells = []
    for (let i = 0; i < this.width; i++) {
      cells[i] = []
      for (let j = 0; j < this.height; j++) {
        cells[i][j] = {
          path: this.getCellPath(i, j)
        }
        if (oldCells && oldCells[i] && oldCells[i][j]) {
          cells[i][j].state = oldCells[i][j].state
        } else {
          cells[i][j].state = 0
        }
      }
    }
    cells.forEach((cs, i) => cs.forEach((cell, j) => {
      cell.neighbors = this.getNeighbors(i, j).map(([dx, dy]) => {
        const x = mod(i + dx, this.width)
        const y = mod(j + dy, this.height)
        return cells[x][y]
      })
      cell.score = cell.neighbors.reduce((m, nei) => m + nei.state, 0)
      this.drawCell(cell)
    }))
    this.cells = cells
  }

  getSize() {
    return {
      width: Math.floor(this.ctx.canvas.width / this.cellsize),
      height: Math.floor(this.ctx.canvas.height / this.cellsize)
    }
  }
  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        this.cells[i][j].state = 0
        this.cells[i][j].score = 0
      }
    }
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
    if (this.cells[i][j].state) {
      this.cells[i][j].neighbors.forEach(nei => {
        nei.score --
        this.drawCell(nei)
      })
    }
    this.cells[i][j].state = 0
    this.drawCell(this.cells[i][j])
  }
  fillPoint(i, j) {
    if (!this.cells[i][j].state) {
      this.cells[i][j].neighbors.forEach(nei => {
        nei.score ++
        this.drawCell(nei)
      })
    }
    this.cells[i][j].state = 1
    this.drawCell(this.cells[i][j])
  }
  drawCell(cell) {
    if (cell.state) {
      const color = this.color !== null ? this.color : 240 - cell.score * 30
      this.ctx.fillStyle = `hsl(${color}, 100%, 50%)`
    } else {
      this.ctx.fillStyle = '#ffffff'
    }
    this.ctx.fill(cell.path)
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
  step() {
    const changes = []
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        if (this.cells[i][j].state && !this.survive.includes(this.cells[i][j].score)) {
          changes.push(this.cells[i][j])
          this.cells[i][j].state = 0
        } else if (!this.cells[i][j].state && this.spawn.includes(this.cells[i][j].score)) {
          changes.push(this.cells[i][j])
          this.cells[i][j].state = 1
        }
      }
    }
    const redraw = new Set(changes)
    changes.forEach(cell => {
      const scoreCange = cell.state * 2 - 1
      cell.neighbors.forEach(nei => {
        nei.score += scoreCange
        if (this.color === null && nei.state) {
          redraw.add(nei)
        }
      })
    })
    redraw.forEach(cell => this.drawCell(cell))
    if (this.color !== null) {
      this.color = mod(this.color + 1, 360)
    }
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
  clicked(x, y, toggle) {
    const i = mod(Math.floor((x - ROOT1_3 * y) / this.cellsize + 0.75), this.width)
    const j = mod(Math.floor((2 * ROOT1_3 * y) / this.cellsize + 0.75 * ROOT1_3), this.height)
    if (toggle && this.cells[i][j].state) {
      this.blankPoint(i, j)
    } else {
      this.fillPoint(i, j)
    }
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
  clicked(x, y, toggle) {
    const i = mod(Math.floor((x * ROOT3 - y) / 2 / this.cellsize), this.width)
    const j = mod(Math.floor((2 * y) / this.cellsize), this.height)
    if (toggle && this.cells[i][j].state) {
      this.blankPoint(i, j)
    } else {
      this.fillPoint(i, j)
    }
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
const logicClass = {
  rect: ConwayGameOfLife,
  hex: HexGameOfLife,
  tri: TriangleGameOfLife
}
