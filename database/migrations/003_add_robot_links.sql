-- Add CAD and Code link fields to robots table
ALTER TABLE robots 
ADD COLUMN cad_link VARCHAR(1000),
ADD COLUMN code_link VARCHAR(1000);