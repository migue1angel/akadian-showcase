## Case Study: Circular classes and real progress

### Problem

In the original model, courses had a fixed start date. But in real operations, students enroll at any time, even when the course is already at class 5 or 8. That made progress confusing and created friction for coordinators and students.

### Solution

We redefined course duration by the number of classes in the program, not by dates. Each course runs in a circular sequence: when it reaches the last class, it immediately starts again. With this, a student's progress is measured by how many classes they complete until they reach the program total, regardless of the class where they joined.

On the backend, the enrollment stores `startingClassNumber` at sign-up, and progress is computed as `classesCompleted` over `totalClasses`. Session creation respects circularity by resetting `classNumber` when it exceeds the total.

### Result

Consistent, easy-to-understand progress for students, less operational friction for coordinators, and a continuous class flow without breaking cohorts or rescheduling calendars.
