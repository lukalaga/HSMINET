using Microsoft.EntityFrameworkCore.Migrations;

namespace HSMINET.Migrations
{
    public partial class in_build_2 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Notifications_",
                table: "Incidences");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Notifications_",
                table: "Incidences",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
