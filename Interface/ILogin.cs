using HSMINET.Models;

namespace HSMINET.Interface
{
    public interface ILogin
    {
        Registration ValidateUser(string userName, string Password);

        bool UpdatePassword(Registration Registration);

        string GetPasswordbyUserID(int UserID);
    }
}