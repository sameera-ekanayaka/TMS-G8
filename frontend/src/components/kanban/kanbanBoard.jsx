import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTasks } from '../../context/TaskContext';
import { Plus, Calendar, User } from 'lucide-react';
import TaskForm from '../Task/TaskForm';

const STATUSES = ['To Do', 'In Progress', 'Completed'];

const KanbanBoard = () => {
  const { tasks, changeTaskStatus, loading } = useTasks();
  const [groupedTasks, setGroupedTasks] = useState({});
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  useEffect(() => {
    const grouped = STATUSES.reduce((acc, status) => {
      acc[status] = tasks.filter(task => task.status === status);
      return acc;
    }, {});
    setGroupedTasks(grouped);
  }, [tasks]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) return;

    // Update local state
    const sourceColumn = [...groupedTasks[source.droppableId]];
    const [removed] = sourceColumn.splice(source.index, 1);
    const destColumn = [...groupedTasks[destination.droppableId]];
    destColumn.splice(destination.index, 0, removed);

    setGroupedTasks({
      ...groupedTasks,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn,
    });

    // Update backend
    try {
      await changeTaskStatus(draggableId, destination.droppableId);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'To Do': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    if (!date) return 'No date';
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-gray-500">Drag and drop tasks between columns</p>
        </div>
        <button
          onClick={() => {
            setSelectedStatus(null);
            setShowTaskForm(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUSES.map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-gray-50 rounded-lg p-4 min-h-[400px] ${
                    snapshot.isDraggingOver ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({groupedTasks[status]?.length || 0})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStatus(status);
                        setShowTaskForm(true);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {groupedTasks[status]?.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
                            }`}
                          >
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{task.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className="text-xs flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                  <Calendar size={12} />
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                              {task.assignedUser && (
                                <span className="text-xs flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                                  <User size={12} />
                                  {task.assignedUser}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {showTaskForm && (
        <TaskForm
          onClose={() => {
            setShowTaskForm(false);
            setSelectedStatus(null);
          }}
          defaultStatus={selectedStatus}
        />
      )}
    </>
  );
};

export default KanbanBoard;