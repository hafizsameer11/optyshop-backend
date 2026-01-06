-- AlterTable
-- Add image_url and link_url columns to marketing_campaigns table
-- This uses a stored procedure approach to check if columns exist before adding

DELIMITER $$

CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(64),
    IN columnName VARCHAR(64),
    IN columnDefinition TEXT
)
BEGIN
    DECLARE columnExists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO columnExists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = tableName
      AND COLUMN_NAME = columnName;
    
    IF columnExists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD COLUMN `', columnName, '` ', columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

CALL AddColumnIfNotExists('marketing_campaigns', 'image_url', 'VARCHAR(500) NULL');
CALL AddColumnIfNotExists('marketing_campaigns', 'link_url', 'VARCHAR(500) NULL');

DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

