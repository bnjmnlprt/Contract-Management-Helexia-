import React from 'react';
import type { SavedProject } from '../utils/types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';

interface CalendarPageProps {
    projects: SavedProject[];
    onViewProject: (id: string) => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ projects, onViewProject }) => {
    const events = projects.flatMap(project =>
        (project.deadlines || []).map(deadline => ({
            title: `${project.projectName}: ${deadline.description}`,
            date: deadline.date,
            extendedProps: {
                projectId: project.id,
            },
            // Adding some color based on project type for better UX
            backgroundColor: project.projectType === 'EPC' ? '#002D62' : 
                             project.projectType.includes('IPP') ? '#00A99D' : 
                             '#6c757d',
            borderColor: project.projectType === 'EPC' ? '#002D62' : 
                         project.projectType.includes('IPP') ? '#00A99D' : 
                         '#6c757d',
        }))
    );

    const handleEventClick = (clickInfo: any) => {
        onViewProject(clickInfo.event.extendedProps.projectId);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-[80vh]">
            <h2 className="text-2xl font-bold text-primary mb-4">Calendrier des Échéances</h2>
            <div className="h-full pb-12">
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={frLocale}
                    events={events}
                    eventClick={handleEventClick}
                    height="100%"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek,dayGridDay'
                    }}
                    buttonText={{
                        today:    'Aujourd\'hui',
                        month:    'Mois',
                        week:     'Semaine',
                        day:      'Jour',
                    }}
                    eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
                />
            </div>
        </div>
    );
};

export default CalendarPage;