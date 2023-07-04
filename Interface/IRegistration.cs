using HSMINET.Models;
using System.Linq;

namespace HSMINET.Interface
{
    public interface IRegistration
    {
        bool CheckUserNameExists(string Username);
        int AddUser(Registration entity);
        IQueryable<Registration> ListofRegisteredUser(string sortColumn, string sortColumnDir, string Search);
        bool UpdatePassword(string RegistrationID, string Password);
        RegistrationViewModel UserInformation(int UserID);
    }
}