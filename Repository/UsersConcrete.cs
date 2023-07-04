using HSMINET.Interface;
using HSMINET.Models;
using Repository;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;

namespace HSMINET.Repository
{
    public class UsersConcrete : IUsers
    {
        private readonly ApplicationDbContext _context;

        public UsersConcrete(ApplicationDbContext context)
        {
            _context = context;
        }

        public IQueryable<IncidenceViewSummaryModel> ShowallClosedTickets(string sortColumn, string sortColumnDir, string Search, int? RegistrationID)
        {
            var IQClosed = (from registration in _context.Incidences
                            join assignedtickets in _context.AssignedTickets on registration.Notifications_Id equals assignedtickets.Notifications_Id
                            where registration.RoleID == null && assignedtickets.AssignToUser == RegistrationID
                            select new IncidenceViewSummaryModel
                            {
                                Name = registration.Name,
                                Notifications_Id = registration.Notifications_Id,
                                DateReported = registration.DateReported,
                                DepartmentFloor = registration.Departmentfloor,
                                Extension=registration.Extension,
                                Department = registration.Department
                            });
            if (!(string.IsNullOrEmpty(sortColumn) && string.IsNullOrEmpty(sortColumnDir)))
            {
                IQClosed = IQClosed.OrderBy(sortColumn + " " + sortColumnDir);
            }
            if (!string.IsNullOrEmpty(Search))
            {
                IQClosed = IQClosed.Where(m => m.Name == Search);
            }
            return IQClosed;
        }

        public IQueryable<IncidenceViewSummaryModel> ShowallTicketsUnderAgent(string sortColumn, string sortColumnDir, string Search, int? RegistrationID)
        {
            var IQUsers = (from registration in _context.Incidences
                           join assignedTickets in _context.AssignedTickets on registration.Notifications_Id equals assignedTickets.Notifications_Id
                           where registration.RoleID == 2 && assignedTickets.AssignToUser == RegistrationID
                           select new IncidenceViewSummaryModel
                           {
                               Name = registration.Name,
                               Notifications_Id = registration.Notifications_Id,
                               Extension = registration.Extension,
                               DateReported = registration.DateReported,
                               Department = registration.Department,
                               DepartmentFloor = registration.Departmentfloor
                           });
            if (!(string.IsNullOrEmpty(sortColumn) && string.IsNullOrEmpty(sortColumnDir)))
            {
                IQUsers = IQUsers.OrderBy(sortColumn + " " + sortColumnDir);
            }
            if (!string.IsNullOrEmpty(Search))
            {
                IQUsers = IQUsers.Where(m => m.Name == Search);
            }

            return IQUsers;
        }
    }
}