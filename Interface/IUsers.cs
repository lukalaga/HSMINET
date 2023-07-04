using HSMINET.Models;
using System.Linq;

namespace HSMINET.Interface
{
    public interface IUsers
    {
        IQueryable<IncidenceViewSummaryModel> ShowallClosedTickets(string sortColumn, string sortColumnDir, string Search, int? RegistrationID);

        IQueryable<IncidenceViewSummaryModel> ShowallTicketsUnderAgent(string sortColumn, string sortColumnDir, string Search, int? RegistrationID);
    }
}