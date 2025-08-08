// Data Management
class ProductivityManager {
  constructor() {
    this.tasks = this.loadTasks()
    this.projects = this.loadProjects()
    this.currentView = "all"
    this.currentProject = null
    this.editingTask = null

    this.init()
  }

  init() {
    this.setupEventListeners()
    this.renderProjects()
    this.renderTasks()
    this.updateStats()
  }

  // Data persistence
  loadTasks() {
    const saved = localStorage.getItem("productivity_tasks")
    return saved ? JSON.parse(saved) : this.getDefaultTasks()
  }

  saveTasks() {
    localStorage.setItem("productivity_tasks", JSON.stringify(this.tasks))
  }

  loadProjects() {
    const saved = localStorage.getItem("productivity_projects")
    return saved ? JSON.parse(saved) : this.getDefaultProjects()
  }

  saveProjects() {
    localStorage.setItem("productivity_projects", JSON.stringify(this.projects))
  }

  getDefaultTasks() {
    return [
      {
        id: 1,
        title: "Complete project proposal",
        description: "Write and submit the Q1 project proposal for the new marketing campaign",
        priority: "high",
        status: "in-progress",
        dueDate: this.formatDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
        project: "work",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Review team feedback",
        description: "Go through all the feedback from the team meeting and create action items",
        priority: "medium",
        status: "pending",
        dueDate: this.formatDate(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)),
        project: "work",
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        title: "Update portfolio website",
        description: "Add recent projects and update the design to match current trends",
        priority: "low",
        status: "pending",
        dueDate: this.formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        project: "personal",
        createdAt: new Date().toISOString(),
      },
    ]
  }

  getDefaultProjects() {
    return [
      { id: "work", name: "Work Projects", color: "#3b82f6" },
      { id: "personal", name: "Personal", color: "#10b981" },
      { id: "learning", name: "Learning", color: "#f59e0b" },
    ]
  }

  // Event listeners
  setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        this.setView(e.target.dataset.view)
      })
    })

    // Modal controls
    document.getElementById("addTaskBtn").addEventListener("click", () => this.openTaskModal())
    document.getElementById("closeModal").addEventListener("click", () => this.closeTaskModal())
    document.getElementById("cancelBtn").addEventListener("click", () => this.closeTaskModal())
    document.getElementById("taskForm").addEventListener("submit", (e) => this.handleTaskSubmit(e))

    // Project modal
    document.getElementById("addProjectBtn").addEventListener("click", () => this.openProjectModal())
    document.getElementById("closeProjectModal").addEventListener("click", () => this.closeProjectModal())
    document.getElementById("cancelProjectBtn").addEventListener("click", () => this.closeProjectModal())
    document.getElementById("projectForm").addEventListener("submit", (e) => this.handleProjectSubmit(e))

    // Filters
    document.getElementById("priorityFilter").addEventListener("change", () => this.renderTasks())
    document.getElementById("statusFilter").addEventListener("change", () => this.renderTasks())

    // Export
    document.getElementById("exportBtn").addEventListener("click", () => this.exportData())

    // Close modal on overlay click
    document.getElementById("taskModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.closeTaskModal()
    })
    document.getElementById("projectModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.closeProjectModal()
    })
  }

  // View management
  setView(view, project = null) {
    this.currentView = view
    this.currentProject = project

    // Update active nav link
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active")
    })

    if (project) {
      document.querySelector(`[data-project="${project}"]`).classList.add("active")
      document.getElementById("currentViewTitle").textContent =
        this.projects.find((p) => p.id === project)?.name || "Project"
    } else {
      document.querySelector(`[data-view="${view}"]`).classList.add("active")
      const titles = {
        all: "All Tasks",
        today: "Today's Tasks",
        upcoming: "Upcoming Tasks",
        completed: "Completed Tasks",
      }
      document.getElementById("currentViewTitle").textContent = titles[view]
    }

    this.renderTasks()
  }

  // Task management
  addTask(taskData) {
    const task = {
      id: Date.now(),
      ...taskData,
      createdAt: new Date().toISOString(),
    }
    this.tasks.push(task)
    this.saveTasks()
    this.renderTasks()
    this.updateStats()
  }

  updateTask(id, taskData) {
    const index = this.tasks.findIndex((task) => task.id === id)
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...taskData }
      this.saveTasks()
      this.renderTasks()
      this.updateStats()
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((task) => task.id !== id)
    this.saveTasks()
    this.renderTasks()
    this.updateStats()
  }

  toggleTaskStatus(id) {
    const task = this.tasks.find((task) => task.id === id)
    if (task) {
      task.status = task.status === "completed" ? "pending" : "completed"
      this.saveTasks()
      this.renderTasks()
      this.updateStats()
    }
  }

  // Project management
  addProject(projectData) {
    const project = {
      id: Date.now().toString(),
      ...projectData,
    }
    this.projects.push(project)
    this.saveProjects()
    this.renderProjects()
    this.updateProjectOptions()
  }

  // Rendering
  renderTasks() {
    const taskList = document.getElementById("taskList")
    const emptyState = document.getElementById("emptyState")

    const filteredTasks = this.getFilteredTasks()

    if (filteredTasks.length === 0) {
      taskList.style.display = "none"
      emptyState.style.display = "block"
      return
    }

    taskList.style.display = "block"
    emptyState.style.display = "none"

    taskList.innerHTML = filteredTasks.map((task) => this.createTaskHTML(task)).join("")

    // Add event listeners to task items
    taskList.querySelectorAll(".task-item").forEach((item) => {
      const taskId = Number.parseInt(item.dataset.taskId)

      item.querySelector('.task-action-btn[data-action="toggle"]').addEventListener("click", (e) => {
        e.stopPropagation()
        this.toggleTaskStatus(taskId)
      })

      item.querySelector('.task-action-btn[data-action="edit"]').addEventListener("click", (e) => {
        e.stopPropagation()
        this.editTask(taskId)
      })

      item.querySelector('.task-action-btn[data-action="delete"]').addEventListener("click", (e) => {
        e.stopPropagation()
        if (confirm("Are you sure you want to delete this task?")) {
          this.deleteTask(taskId)
        }
      })
    })
  }

  getFilteredTasks() {
    let filtered = [...this.tasks]

    // Filter by view
    const today = new Date().toISOString().split("T")[0]
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    switch (this.currentView) {
      case "today":
        filtered = filtered.filter((task) => task.dueDate === today)
        break
      case "upcoming":
        filtered = filtered.filter((task) => task.dueDate && task.dueDate > today)
        break
      case "completed":
        filtered = filtered.filter((task) => task.status === "completed")
        break
    }

    // Filter by project
    if (this.currentProject) {
      filtered = filtered.filter((task) => task.project === this.currentProject)
    }

    // Filter by priority
    const priorityFilter = document.getElementById("priorityFilter").value
    if (priorityFilter) {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    // Filter by status
    const statusFilter = document.getElementById("statusFilter").value
    if (statusFilter) {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    // Sort by due date and priority
    filtered.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate)
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1

      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    return filtered
  }

  createTaskHTML(task) {
    const project = this.projects.find((p) => p.id === task.project)
    const projectName = project ? project.name : "No Project"
    const projectColor = project ? project.color : "#64748b"

    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"

    return `
            <div class="task-item ${task.status === "completed" ? "completed" : ""}" data-task-id="${task.id}">
                <div class="task-item-header">
                    <div>
                        <h3 class="task-item-title">${task.title}</h3>
                        ${task.description ? `<p class="task-item-description">${task.description}</p>` : ""}
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn" data-action="toggle" title="${task.status === "completed" ? "Mark as pending" : "Mark as completed"}">
                            ${task.status === "completed" ? "↶" : "✓"}
                        </button>
                        <button class="task-action-btn" data-action="edit" title="Edit task">✏️</button>
                        <button class="task-action-btn" data-action="delete" title="Delete task">🗑️</button>
                    </div>
                </div>
                <div class="task-item-meta">
                    <div class="task-item-tags">
                        <span class="task-priority ${task.priority}">${task.priority}</span>
                        <span class="task-status ${task.status}">${task.status.replace("-", " ")}</span>
                        ${task.project ? `<span class="project-color" style="background-color: ${projectColor}"></span>` : ""}
                    </div>
                    <div class="task-due-date ${isOverdue ? "overdue" : ""}" style="color: ${isOverdue ? "#dc2626" : "#64748b"}">
                        ${dueDate}${isOverdue ? " (Overdue)" : ""}
                    </div>
                </div>
            </div>
        `
  }

  renderProjects() {
    const projectsList = document.getElementById("projectsList")
    projectsList.innerHTML = this.projects
      .map(
        (project) => `
            <li>
                <a href="#" class="project-item nav-link" data-project="${project.id}">
                    <span class="project-color" style="background-color: ${project.color}"></span>
                    <span class="project-name">${project.name}</span>
                </a>
            </li>
        `,
      )
      .join("")

    // Add event listeners
    projectsList.querySelectorAll(".project-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault()
        this.setView("project", e.currentTarget.dataset.project)
      })
    })

    this.updateProjectOptions()
  }

  updateProjectOptions() {
    const select = document.getElementById("taskProject")
    select.innerHTML =
      '<option value="">No Project</option>' +
      this.projects.map((project) => `<option value="${project.id}">${project.name}</option>`).join("")
  }

  updateStats() {
    const today = new Date().toISOString().split("T")[0]
    const todayTasks = this.tasks.filter(
      (task) => task.dueDate === today || (task.status !== "completed" && (!task.dueDate || task.dueDate <= today)),
    )

    const completedToday = todayTasks.filter((task) => task.status === "completed").length
    const totalToday = todayTasks.length
    const percentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0

    // Update progress ring
    const progressCircle = document.getElementById("progressCircle")
    const circumference = 2 * Math.PI * 35
    const offset = circumference - (percentage / 100) * circumference
    progressCircle.style.strokeDashoffset = offset

    // Update text
    document.getElementById("progressText").textContent = `${percentage}%`
    document.getElementById("completedCount").textContent = completedToday
    document.getElementById("totalCount").textContent = totalToday
  }

  // Modal management
  openTaskModal(task = null) {
    this.editingTask = task
    const modal = document.getElementById("taskModal")
    const form = document.getElementById("taskForm")
    const title = document.getElementById("modalTitle")

    if (task) {
      title.textContent = "Edit Task"
      document.getElementById("taskTitle").value = task.title
      document.getElementById("taskDescription").value = task.description || ""
      document.getElementById("taskPriority").value = task.priority
      document.getElementById("taskStatus").value = task.status
      document.getElementById("taskDueDate").value = task.dueDate || ""
      document.getElementById("taskProject").value = task.project || ""
    } else {
      title.textContent = "Add New Task"
      form.reset()
    }

    modal.classList.add("active")
  }

  closeTaskModal() {
    document.getElementById("taskModal").classList.remove("active")
    this.editingTask = null
  }

  openProjectModal() {
    document.getElementById("projectModal").classList.add("active")
  }

  closeProjectModal() {
    document.getElementById("projectModal").classList.remove("active")
    document.getElementById("projectForm").reset()
  }

  editTask(id) {
    const task = this.tasks.find((task) => task.id === id)
    if (task) {
      this.openTaskModal(task)
    }
  }

  // Form handlers
  handleTaskSubmit(e) {
    e.preventDefault()

    const taskData = {
      title: document.getElementById("taskTitle").value,
      description: document.getElementById("taskDescription").value,
      priority: document.getElementById("taskPriority").value,
      status: document.getElementById("taskStatus").value,
      dueDate: document.getElementById("taskDueDate").value,
      project: document.getElementById("taskProject").value || null,
    }

    if (this.editingTask) {
      this.updateTask(this.editingTask.id, taskData)
    } else {
      this.addTask(taskData)
    }

    this.closeTaskModal()
  }

  handleProjectSubmit(e) {
    e.preventDefault()

    const projectData = {
      name: document.getElementById("projectName").value,
      color: document.getElementById("projectColor").value,
    }

    this.addProject(projectData)
    this.closeProjectModal()
  }

  // Utility functions
  formatDate(date) {
    return date.toISOString().split("T")[0]
  }

  exportData() {
    const data = {
      tasks: this.tasks,
      projects: this.projects,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `productivity-data-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  window.productivityManager = new ProductivityManager()
})

// Make functions available globally for HTML onclick handlers
window.openTaskModal = () => window.productivityManager.openTaskModal()
