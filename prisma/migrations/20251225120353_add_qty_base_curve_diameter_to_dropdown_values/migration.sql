-- AlterEnum: Add new field types to AstigmatismFieldType enum
ALTER TABLE `astigmatism_dropdown_values` MODIFY COLUMN `field_type` ENUM('qty', 'base_curve', 'diameter', 'power', 'cylinder', 'axis') NOT NULL;

