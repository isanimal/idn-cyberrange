import { useState, useEffect } from 'react';
import { labService } from '../api/labService';
import { DeleteLabResponse, LabTemplate, LabDetailResponse } from '../types';

// Simplified hook implementation (replacing React Query for this specific demo environment if libraries aren't fully set up, 
// but sticking to the request of using React Query-like structure).

export const useLabs = (filters: any) => {
  const [data, setData] = useState<LabTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    labService.getLabs(filters).then(res => {
      setData(res);
      setIsLoading(false);
    });
  }, [JSON.stringify(filters)]);

  return { data, isLoading };
};

export const useLabDetail = (id: string) => {
  const [data, setData] = useState<LabDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const refetch = () => {
    setIsLoading(true);
    labService.getLabDetail(id)
      .then(res => setData(res))
      .catch(err => setError(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (id) refetch();
  }, [id]);

  return { data, isLoading, error, refetch };
};

export const useLabMutations = (
  templateId: string,
  instanceId: string | null,
  onSuccess: () => void,
) => {
  const [isActivating, setIsActivating] = useState(false);

  const activate = async () => {
    if (!templateId) return;
    setIsActivating(true);
    try {
      await labService.activateLab(templateId);
      onSuccess();
    } finally {
      setIsActivating(false);
    }
  };

  const deactivate = async (instanceId: string) => {
     setIsActivating(true);
     try {
       await labService.deactivateLab(instanceId);
       onSuccess();
     } finally {
       setIsActivating(false);
     }
  };

  const restart = async (instanceId: string) => {
    setIsActivating(true);
    try {
      await labService.restartLab(instanceId);
      onSuccess();
    } finally {
      setIsActivating(false);
    }
  };

  const updateNotes = async (notes: string) => {
    if (!instanceId) {
      return;
    }
    await labService.updateInstance(instanceId, { notes });
    // Silent update, no full refetch needed usually, but for demo:
    onSuccess(); 
  };

  return { activate, deactivate, restart, updateNotes, isActivating };
};

// --- ADMIN HOOKS ---

export const useAdminLabs = () => {
  const [data, setData] = useState<LabTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = () => {
    setIsLoading(true);
    labService.getAllLabsAdmin().then(res => {
      setData(res);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    refetch();
  }, []);

  return { data, isLoading, refetch };
};

export const useAdminLabMutations = (onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLab = async (data: Partial<LabTemplate>): Promise<LabTemplate> => {
    setIsSubmitting(true);
    try {
      const created = await labService.createLab(data);
      onSuccess();
      return created;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLab = async (id: string, data: Partial<LabTemplate>): Promise<LabTemplate> => {
    setIsSubmitting(true);
    try {
      const updated = await labService.updateLab(id, data);
      onSuccess();
      return updated;
    } finally {
      setIsSubmitting(false);
    }
  };

  const publishLab = async (id: string, version: string, notes: string) => {
    setIsSubmitting(true);
    try {
      await labService.publishLab(id, version, notes);
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  const archiveLab = async (id: string) => {
    setIsSubmitting(true);
    try {
      await labService.archiveLab(id);
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const deleteLab = async (id: string): Promise<DeleteLabResponse> => {
    setIsSubmitting(true);
    try {
      const deleted = await labService.deleteLab(id);
      onSuccess();
      return deleted;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, createLab, updateLab, publishLab, archiveLab, deleteLab };
};
