-- Performance: add missing FK indexes so JOIN/WHERE lookups use O(log N) scans
-- instead of full table scans.  SQLite never creates indexes automatically for
-- foreign-key columns, so every Prisma `include` that traverses a relation was
-- doing a sequential scan.

-- Discipline
CREATE INDEX IF NOT EXISTS "Discipline_periodId_idx" ON "Discipline"("periodId");

-- Material
CREATE INDEX IF NOT EXISTS "Material_disciplineId_idx" ON "Material"("disciplineId");
CREATE INDEX IF NOT EXISTS "Material_uploadedById_idx" ON "Material"("uploadedById");
CREATE INDEX IF NOT EXISTS "Material_libraryItemId_idx" ON "Material"("libraryItemId");

-- MaterialProgress (userId is the leftmost column of the composite unique index,
-- but an explicit index makes the query planner's choice unambiguous)
CREATE INDEX IF NOT EXISTS "MaterialProgress_userId_idx" ON "MaterialProgress"("userId");

-- LibraryItem
CREATE INDEX IF NOT EXISTS "LibraryItem_uploadedById_idx" ON "LibraryItem"("uploadedById");

-- Exercise
CREATE INDEX IF NOT EXISTS "Exercise_createdById_idx" ON "Exercise"("createdById");
CREATE INDEX IF NOT EXISTS "Exercise_materialId_idx" ON "Exercise"("materialId");
CREATE INDEX IF NOT EXISTS "Exercise_libraryItemId_idx" ON "Exercise"("libraryItemId");
CREATE INDEX IF NOT EXISTS "Exercise_status_idx" ON "Exercise"("status");

-- ExerciseOption — exerciseId is the primary filter in every options lookup
CREATE INDEX IF NOT EXISTS "ExerciseOption_exerciseId_idx" ON "ExerciseOption"("exerciseId");

-- ExerciseAttempt — exerciseId alone is not covered by the composite unique index
CREATE INDEX IF NOT EXISTS "ExerciseAttempt_exerciseId_idx" ON "ExerciseAttempt"("exerciseId");

-- ExerciseReview — exerciseId alone is not covered by the composite unique index
CREATE INDEX IF NOT EXISTS "ExerciseReview_exerciseId_idx" ON "ExerciseReview"("exerciseId");

-- PsicoTransaction — queried by walletId in every wallet/psicogame load
CREATE INDEX IF NOT EXISTS "PsicoTransaction_walletId_idx" ON "PsicoTransaction"("walletId");

-- StudySession
CREATE INDEX IF NOT EXISTS "StudySession_userId_idx" ON "StudySession"("userId");
CREATE INDEX IF NOT EXISTS "StudySession_microTaskId_idx" ON "StudySession"("microTaskId");

-- MicroTask
CREATE INDEX IF NOT EXISTS "MicroTask_userId_idx" ON "MicroTask"("userId");
CREATE INDEX IF NOT EXISTS "MicroTask_materialId_idx" ON "MicroTask"("materialId");

-- ActiveRecallAnswer
CREATE INDEX IF NOT EXISTS "ActiveRecallAnswer_sessionId_idx" ON "ActiveRecallAnswer"("sessionId");

-- Notification — both queries (list + unread count) filter by userId
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- Task, Event, Note, Document — filtered by userId on every page
CREATE INDEX IF NOT EXISTS "Task_userId_idx" ON "Task"("userId");
CREATE INDEX IF NOT EXISTS "Event_userId_idx" ON "Event"("userId");
CREATE INDEX IF NOT EXISTS "Note_userId_idx" ON "Note"("userId");
CREATE INDEX IF NOT EXISTS "Document_userId_idx" ON "Document"("userId");
