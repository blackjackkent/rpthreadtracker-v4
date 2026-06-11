-- RPThreadTracker v4: Production schema additions
-- Run this against the production database BEFORE deploying the new app.
-- This ONLY creates new tables — it does not modify or drop anything existing.

BEGIN TRY
BEGIN TRAN;

-- PublicViews (replaces DocumentDB storage)
CREATE TABLE [dbo].[PublicViews] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [UserId] NVARCHAR(128) NOT NULL,
    [Name] NVARCHAR(256) NOT NULL,
    [Slug] VARCHAR(256) NOT NULL,
    [IncludeMyTurn] BIT NOT NULL,
    [IncludeTheirTurn] BIT NOT NULL,
    [IncludeQueued] BIT NOT NULL,
    [IncludeArchived] BIT NOT NULL,
    [Columns] NVARCHAR(max) NOT NULL,
    [SortKey] VARCHAR(50) NOT NULL,
    [SortDescending] BIT NOT NULL,
    [CharacterIds] NVARCHAR(max),
    [Tags] NVARCHAR(max),
    CONSTRAINT [PK__PublicVi__3214EC07ADAC6EEB] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UQ_PublicViews_UserId_Slug] UNIQUE NONCLUSTERED ([UserId],[Slug])
);

-- PasswordResetTokens (forgot password flow)
CREATE TABLE [dbo].[PasswordResetTokens] (
    [Id] NVARCHAR(128) NOT NULL,
    [UserId] NVARCHAR(128) NOT NULL,
    [Token] NVARCHAR(max) NOT NULL,
    [ExpiresUtc] DATETIME NOT NULL,
    [UsedUtc] DATETIME,
    CONSTRAINT [PK__Password__3214EC0710F0A6F2] PRIMARY KEY CLUSTERED ([Id])
);

-- EmailChangeTokens (email change verification flow)
CREATE TABLE [dbo].[EmailChangeTokens] (
    [Id] NVARCHAR(128) NOT NULL,
    [UserId] NVARCHAR(128) NOT NULL,
    [NewEmail] NVARCHAR(256) NOT NULL,
    [Token] NVARCHAR(max) NOT NULL,
    [ExpiresUtc] DATETIME NOT NULL,
    [UsedUtc] DATETIME,
    CONSTRAINT [PK__EmailCha__3214EC07304D8410] PRIMARY KEY CLUSTERED ([Id])
);

-- Foreign keys
ALTER TABLE [dbo].[PasswordResetTokens] ADD CONSTRAINT [FK_PasswordResetTokens_AspNetUsers]
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE [dbo].[EmailChangeTokens] ADD CONSTRAINT [FK_EmailChangeTokens_AspNetUsers]
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW
END CATCH
