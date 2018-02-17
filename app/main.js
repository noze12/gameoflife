
const ROOT3 = Math.pow(3, 0.5)
const ROOT1_3 = Math.pow(3, -0.5)
const defaultState = {
  cellsize: 15,
  interval: 100,
  shape: 'square',
  color: 'generation',
  generation: 240,
  survive: "23".split('').map(Number),
  spawn: "3".split('').map(Number),
  start: false,
  border: true,
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
        if (val === 'square' || val === 'hexa' || val === 'tri' ) {
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
      case 'border':
        if (val === '0' || val === '' || val === 'false' ) {
          state.border = false
        } else {
          state.border = true
        }
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
  const speedInput = document.getElementById('interval')
  const sizeInput = document.getElementById('cellsize')
  const shapeSelect = document.getElementById('shape')
  const colorSelect = document.getElementById('color')
  const surviveInput = document.getElementById('survive')
  const spawnInput = document.getElementById('spawn')
  const borderInput = document.getElementById('border')
  speedInput.value = state.interval
  sizeInput.value = state.cellsize
  shapeSelect.value = state.shape
  colorSelect.value = state.color
  surviveInput.value = state.survive.join('')
  spawnInput.value = state.spawn.join('')
  borderInput.checked = state.border
  const fieldElement = document.getElementById('field')
  const canvas = document.createElement('canvas')
  canvas.setAttribute('width', window.innerWidth)
  canvas.setAttribute('height', window.innerHeight)
  fieldElement.appendChild(canvas)
  const ctx = canvas.getContext('2d')
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
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
      startButton.textContent = 'start'
    } else {
      intervalId = setInterval(() => logic.step(), state.interval)
      startButton.textContent = 'stop'
    }
  })
  speedInput.addEventListener('change', () => {
    state.interval = speedInput.value
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
  borderInput.addEventListener('change', () => {
    state.border = borderInput.checked
    logic.redrawAll()
  })
})
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
          path: this.getCellPath(i, j)
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
        this.drawCell(cells[i][j])
      }
    }
    this.cells = cells
  }

  getSize() {
    return {
      width: Math.floor(this.ctx.canvas.width / this.cellsize),
      height: Math.floor(this.ctx.canvas.height / this.cellsize)
    }
  }
  clear() {
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        let oldState = this.cells[i][j].state
        this.cells[i][j].state = 0
        this.cells[i][j].score = 0
        if (oldState) {
          this.drawCell(this.cells[i][j])
        }
      }
    }
  }
  redrawAll() {
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        this.drawCell(this.cells[i][j])
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
        if (nei.state) {
          this.drawCell(nei)
        }
      })
    }
    this.cells[i][j].state = 0
    this.drawCell(this.cells[i][j])
  }
  fillPoint(i, j) {
    if (!this.cells[i][j].state) {
      this.cells[i][j].neighbors.forEach(nei => {
        nei.score ++
        if (nei.state) {
          this.drawCell(nei)
        }
      })
    }
    this.cells[i][j].state = 1
    this.cells[i][j].generation = this.globalState.generation
    this.drawCell(this.cells[i][j])
  }
  drawCell(cell) {
    if (cell.state) {
      let color
      if (this.globalState.color === 'generation') {
        color = cell.generation
      } else {
        color = 240 - cell.score * 30
      }
      this.ctx.fillStyle = `hsl(${color}, 100%, 50%)`
    } else {
      this.ctx.fillStyle = '#ffffff'
    }
    this.ctx.fill(cell.path)
    if (this.globalState.border) {
      this.ctx.strokeStyle = '#f0f0f0'
    } else {
      this.ctx.strokeStyle = '#ffffff'
    }
    this.ctx.stroke(cell.path)
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
    redraw.forEach(cell => this.drawCell(cell))
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
  square: SquareGameOfLife,
  hexa: HexagonalGameOfLife,
  tri: TriangleGameOfLife
}
