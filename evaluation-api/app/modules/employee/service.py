from app.modules.employee.model import Employee


def getEmployeeById(employee_id: int):
    """
    Get employee by id
    :param employee_id: employee id
    :return: employee object
    """
    return Employee.query.filter_by(id=employee_id).first()
