/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { KDLServices, KDLSharedServices } from './language-server/kdl-module.js';

/**
 * Language services required in GLSP.
 */
export const KDLLSPServices = Symbol('KDLLSPServices');
export interface KDLLSPServices {
    /** Language services shared across all languages. */
    shared: KDLSharedServices;
    /** CrossModel language-specific services. */
    language: KDLServices;
}
