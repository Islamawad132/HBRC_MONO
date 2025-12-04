import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Employee unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'employee@hbrc.com',
    description: 'Employee email address',
  })
  email: string;

  @ApiProperty({
    example: 'أحمد',
    description: 'Employee first name',
  })
  firstName: string;

  @ApiProperty({
    example: 'محمد',
    description: 'Employee last name',
  })
  lastName: string;

  @ApiPropertyOptional({
    example: '01012345678',
    description: 'Employee phone number',
  })
  phone?: string;

  @ApiProperty({
    example: 'EMP-001',
    description: 'Employee ID number',
  })
  employeeId: string;

  @ApiProperty({
    example: 'المعامل',
    description: 'Department',
  })
  department: string;

  @ApiProperty({
    example: 'مدير المعمل',
    description: 'Job position',
  })
  position: string;

  @ApiPropertyOptional({
    example: 'معهد بحوث الإسكان والبناء',
    description: 'Institute affiliation',
  })
  institute?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the employee account is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Assigned role ID',
  })
  roleId: string;

  @ApiProperty({
    description: 'Employee role information',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'مدير المعمل',
      description: 'Lab Manager - Manages lab operations and staff',
    },
  })
  role: {
    id: string;
    name: string;
    description: string | null;
  };

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Account creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
