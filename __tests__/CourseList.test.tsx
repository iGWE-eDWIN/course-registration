// __tests__/CourseList.test.tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import CourseList from '@/components/CourseList';
import { DatabaseProvider } from '@/lib/storage';

beforeEach(() => window.localStorage.clear());

function addButtonFor(courseCode: string) {
  const row = document.querySelector(`[data-course="${courseCode}"]`) as HTMLElement;
  return { row, button: within(row).getByRole('button', { name: /add/i }) };
}

test('shows a success message, then a clash message naming the clashing course', async () => {
  render(<DatabaseProvider><CourseList studentId="CSC/2023/001" /></DatabaseProvider>);

  const web = addButtonFor('CSC311');
  fireEvent.click(web.button);
  expect(await within(web.row).findByText('CSC311 registered successfully.')).toBeInTheDocument();

  const graphics = addButtonFor('CSC313');
  fireEvent.click(graphics.button);
  expect(await within(graphics.row).findByText(/Clash found with CSC311 \(Web Application Development\)/)).toBeInTheDocument();
  expect(screen.getAllByText('Registered').length).toBe(1);
});
