using Microsoft.EntityFrameworkCore.Migrations;

namespace HSMINET.Migrations
{
    public partial class ticketuseraddition : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TicketUser",
                table: "Incidences",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TicketUser",
                table: "Incidences");
        }
    }
}
