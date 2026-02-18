# 🔍 Task System Debugging Guide

## Current Issue
Tasks are not appearing in the Kanban board, cards are not clickable, and the drawer doesn't open.

---

## 🧪 Step-by-Step Debugging

### **Step 1: Check Browser Console Logs**

After refreshing the page (Ctrl+F5), open the browser console (F12) and look for these logs:

#### **Expected Console Output:**
```
📋 Tasks API Response: { success: true, tasks: [...] }
📋 Tasks Array: [array of task objects]
📁 Groups API Response: { success: true, groups: [...] }
📁 Groups Array: [array of group objects]
🎯 State Check: {
  tasksCount: X,
  groupsCount: Y,
  tasksByGroup: {...},
  tasks: [...],
  groups: [...]
}
```

#### **What to Check:**
1. **Are the API calls succeeding?**
   - Look for `📋 Tasks API Response` and `📁 Groups API Response`
   - If you see `❌ Tasks API failed` or `❌ Groups API failed`, the API is not working

2. **What data is being returned?**
   - Check the `tasks` array - does it have any items?
   - Check the `groups` array - does it have any items?
   - Look at the structure of each task object

3. **Is the state being set correctly?**
   - Check `🎯 State Check` log
   - `tasksCount` should match the number of tasks
   - `groupsCount` should match the number of groups
   - `tasksByGroup` should have tasks grouped by group ID

---

## 🔧 Common Issues and Fixes

### **Issue 1: API Returns Empty Arrays**

**Symptoms:**
- `tasksCount: 0` and `groupsCount: 0`
- No task cards appear

**Cause:**
- No tasks or groups exist in the database for this project

**Fix:**
1. Create task groups first:
   - Go to project settings
   - Create groups like "To Do", "In Progress", "Done"

2. Create tasks:
   - Click "New Task" button
   - Fill in details and create

### **Issue 2: Tasks Have Wrong `group_id` Field**

**Symptoms:**
- Tasks exist but don't appear in columns
- `tasksByGroup` is empty for all groups

**Cause:**
- Task objects use different field name (e.g., `task_group_id` instead of `group_id`)

**Fix:**
Check the task object structure in console:
```javascript
// If tasks use task_group_id instead of group_id:
const tasksByGroup = {};
groups.forEach(group => {
  tasksByGroup[group.id] = tasks
    .filter(task => task.task_group_id === group.id) // Changed field name
    .sort((a, b) => (a.order_column ?? 0) - (b.order_column ?? 0));
});
```

### **Issue 3: API Endpoints Not Found (404)**

**Symptoms:**
- `❌ Tasks API failed: 404 Not Found`
- `❌ Groups API failed: 404 Not Found`

**Cause:**
- Routes not registered or middleware blocking

**Fix:**
Check `routes/auth.php` has these routes:
```php
Route::get('/projects/{project}/tasks', [ProjectController::class, 'apiTasks']);
Route::get('/projects/{project}/groups', [ProjectController::class, 'apiGroups']);
```

### **Issue 4: Task Cards Not Rendering**

**Symptoms:**
- Console shows tasks exist
- But no cards appear in columns

**Cause:**
- JSX rendering logic issue
- Conditional rendering hiding cards

**Check:**
Look at the JSX in `Workspace.jsx` around line 548:
```jsx
{tasksByGroup[group.id]?.map((task, index) => (
  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
    {/* Task card should be here */}
  </Draggable>
))}
```

### **Issue 5: Task Cards Not Clickable**

**Symptoms:**
- Cards appear but clicking does nothing

**Cause:**
- Drag handlers blocking click events
- Missing onClick handler

**Fix:**
Ensure Card has onClick:
```jsx
<Card 
  onClick={() => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  }}
>
```

### **Issue 6: Drawer Doesn't Open**

**Symptoms:**
- Click works but drawer doesn't appear

**Cause:**
- `showTaskDetail` state not updating
- Drawer not mounted in JSX

**Check:**
1. Verify state updates in console:
```javascript
// Add to onClick handler:
onClick={() => {
  console.log('🖱️ Task clicked:', task);
  setSelectedTask(task);
  setShowTaskDetail(true);
  console.log('✅ State should update');
}}
```

2. Verify drawer is mounted at bottom of component:
```jsx
<EnhancedTaskDetailDrawer
  task={selectedTask}
  open={showTaskDetail}
  onClose={() => {
    setShowTaskDetail(false);
    setSelectedTask(null);
  }}
/>
```

---

## 📊 Data Structure Reference

### **Expected Task Object:**
```javascript
{
  id: 1,
  name: "Task name",
  description: "Task description",
  group_id: 1,  // or task_group_id
  assigned_to_user_id: 2,
  assigned_to_user: {
    id: 2,
    name: "John Doe",
    avatar: "url"
  },
  task_group: {
    id: 1,
    name: "To Do",
    project_id: 1
  },
  due_on: "2026-02-10",
  order_column: 1000,
  created_at: "2026-02-05T10:00:00Z"
}
```

### **Expected Group Object:**
```javascript
{
  id: 1,
  name: "To Do",
  project_id: 1,
  order_column: 1,
  tasks_count: 5
}
```

---

## 🎯 Quick Verification Checklist

Run these checks in browser console:

```javascript
// 1. Check if tasks state has data
console.log('Tasks:', tasks);

// 2. Check if groups state has data
console.log('Groups:', groups);

// 3. Check if tasksByGroup is populated
console.log('Tasks by Group:', tasksByGroup);

// 4. Check if drawer state exists
console.log('Show Drawer:', showTaskDetail);
console.log('Selected Task:', selectedTask);

// 5. Manually trigger drawer open
setShowTaskDetail(true);
setSelectedTask(tasks[0]);
```

---

## 🚀 Next Steps

1. **Refresh page** (Ctrl+F5)
2. **Open console** (F12)
3. **Check all console logs** above
4. **Report findings**:
   - What do the API responses show?
   - How many tasks and groups?
   - What's in tasksByGroup?
   - Any errors?

This will help identify the exact issue preventing the UI from working.

---

## 🔍 Additional Debugging

If tasks still don't appear, add this temporary debug component:

```jsx
{/* Add after the header, before Kanban board */}
<div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
  <h3 className="font-bold">Debug Info:</h3>
  <p>Tasks: {tasks.length}</p>
  <p>Groups: {groups.length}</p>
  <p>Tasks by Group: {JSON.stringify(Object.keys(tasksByGroup).map(k => ({
    groupId: k,
    count: tasksByGroup[k].length
  })))}</p>
  {tasks.length > 0 && (
    <details>
      <summary>First Task</summary>
      <pre>{JSON.stringify(tasks[0], null, 2)}</pre>
    </details>
  )}
</div>
```

This will show exactly what data is available and help identify the issue.
