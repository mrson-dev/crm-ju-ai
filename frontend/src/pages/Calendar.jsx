import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { caseService } from '@/services/crmService'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  addDays
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Briefcase,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { LoadingSpinner } from '@/components/common'
import PageHeader from '@/components/common/PageHeader'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => caseService.getAll(null, 100),
  })

  // Gera eventos simulados baseados nos casos
  const generateEvents = () => {
    const events = []
    
    cases.forEach((caseItem, index) => {
      // Adiciona evento de criação
      if (caseItem.created_at) {
        events.push({
          id: `${caseItem.id}-created`,
          caseId: caseItem.id,
          title: caseItem.title,
          date: new Date(caseItem.created_at),
          type: 'created',
          status: caseItem.status,
        })
      }

      // Simula prazos para casos em andamento
      if (caseItem.status === 'em_andamento' || caseItem.status === 'aguardando') {
        const deadlineDate = addDays(new Date(), (index + 1) * 3)
        events.push({
          id: `${caseItem.id}-deadline`,
          caseId: caseItem.id,
          title: `Prazo: ${caseItem.title}`,
          date: deadlineDate,
          type: 'deadline',
          status: caseItem.status,
          priority: caseItem.priority,
        })
      }
    })

    return events
  }

  const events = generateEvents()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Adiciona dias do mês anterior e posterior para completar a grade
  const startDay = monthStart.getDay()
  const endDay = 6 - monthEnd.getDay()

  const previousMonthDays = Array.from({ length: startDay }, (_, i) => 
    addDays(monthStart, -(startDay - i))
  )

  const nextMonthDays = Array.from({ length: endDay }, (_, i) => 
    addDays(monthEnd, i + 1)
  )

  const allDays = [...previousMonthDays, ...days, ...nextMonthDays]

  const getEventsForDay = (day) => {
    return events.filter(event => isSameDay(event.date, day))
  }

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : []

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const getEventColor = (event) => {
    if (event.type === 'deadline') {
      if (event.priority === 'urgente') return 'bg-red-500'
      if (event.priority === 'alta') return 'bg-orange-500'
      return 'bg-amber-500'
    }
    return 'bg-blue-500'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        title="Agenda"
        description="Visualize prazos, audiências e compromissos."
        icon={CalendarIcon}
        actions={[
          <button
            key="today"
            onClick={() => setCurrentDate(new Date())}
            className="btn btn-secondary w-full sm:w-auto"
          >
            Hoje
          </button>
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-7">
        {/* Calendar */}
        <div className="lg:col-span-3 card p-5 sm:p-7">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-5 sm:mb-7">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-3 sm:mb-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm sm:text-base font-semibold text-slate-600 py-2 sm:py-3"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {allDays.map((day, index) => {
              const dayEvents = getEventsForDay(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const today = isToday(day)

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[85px] sm:min-h-[100px] p-2.5 sm:p-4 rounded-xl border-2 transition-all text-left hover:scale-[1.02]
                    ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'}
                    ${isSelected ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' : 'border-slate-200'}
                    ${today ? 'bg-blue-50/50' : ''}
                    hover:border-blue-400 hover:shadow-sm
                  `}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span
                      className={`
                        text-sm font-semibold
                        ${!isCurrentMonth ? 'text-slate-400' : 'text-slate-900'}
                        ${today ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-sm' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  
                  {/* Events */}
                  <div className="mt-1 space-y-1.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`${getEventColor(event)} text-white text-xs px-2 py-1 rounded-lg truncate font-medium shadow-sm`}
                        title={event.title}
                      >
                        {event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-xs text-slate-500 font-medium">
                        +{dayEvents.length - 2} mais
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Sidebar - Selected Day / Upcoming */}
        <div className="space-y-5">
          {/* Selected Day Events */}
          <div className="card p-5 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold mb-5 flex items-center gap-2.5 text-slate-900">
              <CalendarIcon size={20} />
              {selectedDate 
                ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                : 'Selecione um dia'
              }
            </h3>
            
            {selectedDate ? (
              selectedDayEvents.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {selectedDayEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/cases/${event.caseId}`}
                      className="block p-4 sm:p-5 bg-slate-50 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all duration-200 border border-slate-200 hover:border-blue-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl shadow-sm ${
                          event.type === 'deadline' ? 'bg-amber-100' : 'bg-blue-100'
                        }`}>
                          {event.type === 'deadline' ? (
                            <Clock size={18} className="text-amber-600" />
                          ) : (
                            <Briefcase size={18} className="text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 font-medium">
                            {event.type === 'deadline' ? 'Prazo' : 'Criação'}
                          </p>
                        </div>
                        {event.priority === 'urgente' && (
                          <AlertTriangle size={18} className="text-red-500" />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8 font-medium">
                  Nenhum evento neste dia
                </p>
              )
            ) : (
              <p className="text-slate-500 text-center py-8 font-medium">
                Clique em um dia para ver os eventos
              </p>
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div className="card p-5 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold mb-5 flex items-center gap-2.5 text-slate-900">
              <AlertTriangle size={22} className="text-amber-500" />
              Próximos Prazos
            </h3>
            
            {events
              .filter(e => e.type === 'deadline' && e.date >= new Date())
              .sort((a, b) => a.date - b.date)
              .slice(0, 5)
              .map((event) => (
                <Link
                  key={event.id}
                  to={`/cases/${event.caseId}`}
                  className="block p-3 sm:p-4 border-l-4 border-amber-500 bg-amber-50 rounded-r-xl mb-3 hover:bg-amber-100 hover:shadow-md transition-all"
                >
                  <p className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                    {event.title.replace('Prazo: ', '')}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                    {format(event.date, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </Link>
              ))
            }

            {events.filter(e => e.type === 'deadline' && e.date >= new Date()).length === 0 && (
              <p className="text-gray-500 text-center py-4">
                Nenhum prazo pendente
              </p>
            )}
          </div>

          {/* Legend */}
          <div className="card p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold mb-4 text-slate-900">Legenda</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg bg-blue-500 flex-shrink-0 shadow-sm" />
                <span className="text-sm sm:text-base text-slate-600 font-medium">Criação de processo</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg bg-amber-500 flex-shrink-0 shadow-sm" />
                <span className="text-sm sm:text-base text-slate-600 font-medium">Prazo normal</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg bg-orange-500 flex-shrink-0 shadow-sm" />
                <span className="text-sm sm:text-base text-slate-600 font-medium">Prazo alta prioridade</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg bg-red-500 flex-shrink-0 shadow-sm" />
                <span className="text-sm sm:text-base text-slate-600 font-medium">Prazo urgente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
