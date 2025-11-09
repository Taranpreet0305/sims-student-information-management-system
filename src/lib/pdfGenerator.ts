import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentPerformanceData {
  student_info: {
    name: string;
    enrollment: string;
    course: string;
    year: number;
    section: string;
  };
  performance: {
    attendance: number;
    average_marks: number;
    total_subjects: number;
  };
  marks_by_subject: { subject: string; marks: number }[];
  generated_at: string;
}

export const generateStudentPerformancePDF = (data: StudentPerformanceData) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Performance Report', 105, 20, { align: 'center' });
  
  // Student Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.student_info.name}`, 20, 40);
  doc.text(`Enrollment: ${data.student_info.enrollment}`, 20, 48);
  doc.text(`Course: ${data.student_info.course} - Year ${data.student_info.year} (${data.student_info.section})`, 20, 56);
  
  // Performance Summary Box
  doc.setFillColor(240, 240, 240);
  doc.rect(20, 65, 170, 35, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Summary', 25, 73);
  doc.setFont('helvetica', 'normal');
  doc.text(`Attendance: ${data.performance.attendance}%`, 25, 82);
  doc.text(`Average Marks: ${data.performance.average_marks}%`, 25, 90);
  doc.text(`Total Subjects: ${data.performance.total_subjects}`, 25, 98);
  
  // Subject-wise Marks Table
  if (data.marks_by_subject.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Subject-wise Performance', 20, 115);
    
    const tableData = data.marks_by_subject.map((item) => [
      item.subject,
      `${item.marks}%`,
      item.marks >= 75 ? 'Excellent' : item.marks >= 60 ? 'Good' : item.marks >= 40 ? 'Average' : 'Needs Improvement'
    ]);
    
    autoTable(doc, {
      startY: 120,
      head: [['Subject', 'Marks', 'Grade']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
    });
  }
  
  // Recommendations
  const finalY = (doc as any).lastAutoTable?.finalY || 120;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommendations', 20, finalY + 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const recommendations = [];
  if (data.performance.attendance < 75) {
    recommendations.push('• Improve attendance to meet the minimum 75% requirement');
  }
  if (data.performance.average_marks < 60) {
    recommendations.push('• Focus on improving overall academic performance');
  }
  if (data.performance.average_marks >= 75) {
    recommendations.push('• Excellent performance! Continue the great work');
  }
  
  recommendations.forEach((rec, index) => {
    doc.text(rec, 20, finalY + 25 + (index * 8));
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on: ${new Date(data.generated_at).toLocaleString()}`, 105, 280, { align: 'center' });
  
  // Save
  doc.save(`${data.student_info.enrollment}_performance_report.pdf`);
};

export const generateAttendanceReportPDF = (attendanceData: any[], filters: any) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Attendance Report', 105, 20, { align: 'center' });
  
  // Filter Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 35;
  if (filters.course) doc.text(`Course: ${filters.course}`, 20, yPos += 7);
  if (filters.year) doc.text(`Year: ${filters.year}`, 20, yPos += 7);
  if (filters.section) doc.text(`Section: ${filters.section}`, 20, yPos += 7);
  if (filters.subject) doc.text(`Subject: ${filters.subject}`, 20, yPos += 7);
  
  // Table
  const tableData = attendanceData.map((record) => [
    record.enrollment_number,
    record.subject,
    record.classes_attended,
    record.total_classes,
    `${Math.round((record.classes_attended / record.total_classes) * 100)}%`,
    record.status
  ]);
  
  autoTable(doc, {
    startY: yPos + 10,
    head: [['Enrollment', 'Subject', 'Attended', 'Total', 'Percentage', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
  });
  
  doc.save(`attendance_report_${Date.now()}.pdf`);
};
